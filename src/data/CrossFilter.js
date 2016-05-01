import Transform from './Transform';
import Bitmaps from '../util/Bitmaps';
import SortedIndex from '../util/SortedIndex';
import {id} from '../Tuple';
import {array32, arrayLengthen} from '../util/Arrays';

// Provides an indexed, multi-dimenstional filter.
// The 'fields' parameter takes an array of dimension accessors to filter.
// The 'query' parameter takes an array of per-dimension range queries.
// The 'source' parameter references an (indexed!) collector data source.
export default function CrossFilter(params) {
  Transform.call(this, Bitmaps(), params);
  this.index = [];
  this.seen = array32(0);
}

function Dimension(index, field, query) {
  var dim = SortedIndex();
  dim.field = field;
  dim.one = (1 << index);
  dim.zero = ~dim.one;
  dim.range = query.slice();
  return dim;
}

var prototype = (CrossFilter.prototype = Object.create(Transform.prototype));
prototype.constructor = CrossFilter;

prototype._transform = function(_, pulse) {
  var init = _.modified('fields')
          || _.fields.some(function(f) { return pulse.modified(f.fields); });

  return init
    ? this._init(_, pulse)
    : this._eval(_, pulse);
};

prototype._init = function(_, pulse) {
  // TODO handle existing data...

  var fields = _.fields,
      query = _.query,
      m = query.length,
      dims = this.index = Array(m), // TODO resize if already exists
      q;

  // instantiate dimensions
  for (q=0; q<m; ++q) {
    // TODO update only if modified
    dims[q] = Dimension(q, fields[q], query[q]);
  }

  return this._eval(_, pulse);
};

prototype._eval = function(_, pulse) {
  var output = pulse.materialize().fork(),
      m = this.index.length,
      mask = 0;

  if (pulse.rem.length) {
    this._remove(_, pulse.rem, output.add, pulse.reindex);
    mask |= (1 << m) - 1;
  }

  if (_.modified('query') && !_.modified('fields')) {
    mask |= this._update(_, pulse.stamp, output);
  }

  if (pulse.add.length) {
    this._insert(_, pulse.add, output.add);
    mask |= (1 << m) - 1;
  }

  // TODO: process pulse.mod

  this.value.mask = mask;
  return output;
};

prototype._insert = function(_, tuples, out) {
  var bits = this.value,
      dims = this.index,
      m = dims.length,
      n = _.source.length;

  // resize bitmaps as needed
  bits.resize(n, m);

  var curr = bits.curr(),
      prev = bits.prev(),
      all  = bits.all(),
      i, j, k, t;

  // add to dimensional indices
  for (j=0; j<m; ++j) {
    // update indices and current filter flags
    // relevant entries of curr *must* be initialized to zero
    var dim = dims[j],
        values = dim.insert(dim.field, tuples),
        range = dim.bisect(dim.range, values),
        one = dim.one,
        lo = range[0],
        hi = range[1],
        n1 = values.length;
    for (i=0;  i<lo; ++i) curr[values[i][1]._index] |= one;
    for (i=hi; i<n1; ++i) curr[values[i][1]._index] |= one;
  }

  // set previous filters, output if passes at least one filter
  for (i=0, n=tuples.length; i<n; ++i) {
    t = tuples[i];
    k = t._index;
    prev[k] = all;
    if (curr[k] !== prev[k]) out.push(t);
  }

  return (1 << m) - 1;
};

prototype._remove = function(_, tuples, out, reindex) {
  var dims = this.index,
      bits = this.value,
      curr = bits.curr(),
      prev = bits.prev(),
      all  = bits.all(),
      map = {},
      m = dims.length,
      n = tuples.length,
      i, j, k, t, f;

  // process tuples, output if passes at least one filter
  for (i=0; i<n; ++i) {
    t = tuples[i];
    k = t._index; // for rems, this is *old* index
    map[t._id] = 1; // build id map (TODO get from pulse?)
    prev[k] = (f = curr[k]);
    curr[k] = all;
    if (f !== all) out.push(t);
  }

  // remove from dimensional indices
  for (j=0; j<m; ++j) {
    dims[j].remove(id, null, map);
  }

  // reindex filters
  bits.reindex(_.source.length, reindex);
};

prototype._update = function(_, stamp, output) {
  var dims = this.index,
      bits = this.value,
      curr = bits.curr(),
      prev = bits.prev(),
      query = _.query,
      m = dims.length,
      mask = 0, i, q;

  // survey how many queries have changed
  output.filters = 0;
  for (q=0; q<m; ++q) {
    if (_.modified('query', q)) { i = q; ++mask; }
  }

  if (mask === 1) {
    // only one query changed, use more efficient update
    mask = dims[i].one;
    this._incrementOne(dims[i], query[i], curr, output.add, output.rem);
  } else {
    // multiple queries changes, perform full record keeping
    this.seen = arrayLengthen(this.seen, _.source.length);
    for (q=0, mask=0; q<m; ++q) {
      if (!_.modified('query', q)) continue;
      mask |= dims[q].one;
      this._increment(dims[q], query[q], curr, prev, stamp, output.add);
      output.rem = output.add; // duplicate add/rem for downstream resolve
    }
  }

  return mask;
};

prototype._increment = function(dim, query, curr, prev, stamp, out) {
  var seen = this.seen,
      values = dim.index(),
      old = dim.bisect(dim.range),
      range = dim.bisect(query),
      lo1 = range[0],
      hi1 = range[1],
      lo0 = old[0],
      hi0 = old[1],
      one = dim.one,
      i, j, k, t;

  // Fast incremental update based on previous lo index.
  if (lo1 < lo0) {
    for (i = lo1, j = Math.min(lo0, hi1); i < j; ++i) {
      k = (t = values[i][1])._index;
      if (seen[k] !== stamp) prev[k] = curr[k], seen[k] = stamp, out.push(t);
      curr[k] ^= one;
    }
  } else if (lo1 > lo0) {
    for (i = lo0, j = Math.min(lo1, hi0); i < j; ++i) {
      k = (t = values[i][1])._index;
      if (seen[k] !== stamp) prev[k] = curr[k], seen[k] = stamp, out.push(t);
      curr[k] ^= one;
    }
  }

  // Fast incremental update based on previous hi index.
  if (hi1 > hi0) {
    for (i = Math.max(lo1, hi0), j = hi1; i < j; ++i) {
      k = (t = values[i][1])._index;
      if (seen[k] !== stamp) prev[k] = curr[k], seen[k] = stamp, out.push(t);
      curr[k] ^= one;
    }
  } else if (hi1 < hi0) {
    for (i = Math.max(lo0, hi1), j = hi0; i < j; ++i) {
      k = (t = values[i][1])._index;
      if (seen[k] !== stamp) prev[k] = curr[k], seen[k] = stamp, out.push(t);
      curr[k] ^= one;
    }
  }

  dim.range = query.slice();
};

prototype._incrementOne = function(dim, query, curr, add, rem) {
  var values = dim.index(),
      old = dim.bisect(dim.range),
      range = dim.bisect(query),
      lo1 = range[0],
      hi1 = range[1],
      lo0 = old[0],
      hi0 = old[1],
      one = dim.one,
      i, j, k, t;

  // Fast incremental update based on previous lo index.
  if (lo1 < lo0) {
    for (i = lo1, j = Math.min(lo0, hi1); i < j; ++i) {
      k = (t = values[i][1])._index;
      curr[k] ^= one;
      add.push(t);
    }
  } else if (lo1 > lo0) {
    for (i = lo0, j = Math.min(lo1, hi0); i < j; ++i) {
      k = (t = values[i][1])._index;
      curr[k] ^= one;
      rem.push(t);
    }
  }

  // Fast incremental update based on previous hi index.
  if (hi1 > hi0) {
    for (i = Math.max(lo1, hi0), j = hi1; i < j; ++i) {
      k = (t = values[i][1])._index;
      curr[k] ^= one;
      add.push(t);
    }
  } else if (hi1 < hi0) {
    for (i = Math.max(lo0, hi1), j = hi0; i < j; ++i) {
      k = (t = values[i][1])._index;
      curr[k] ^= one;
      rem.push(t);
    }
  }

  dim.range = query.slice();
};

