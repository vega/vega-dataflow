import Transform from './Transform';
import SortedList from '../util/SortedList';
import {prev} from '../Tuple';

// Filters data tuples according to a range predicate.
// The 'field' parameter is an accessor for the field to index.
// The 'range' parameter is an array specifying the filter range.
// The 'source' parameter links to the source data set.
// TODO: extend to support multiple ranges?
export default function RangeFilter(args) {
  Transform.call(this, new SortedList(), args);
  this._prevRange = null;
}

function inRange(_, range) {
  return range[0] <= _ && _ <= range[1];
}

var prototype = (RangeFilter.prototype = Object.create(Transform.prototype));
prototype.constructor = RangeFilter;

prototype._transform = function(_, pulse) {
  var output = pulse.fork(),
      reset = !this._prevRange || _.modified('field') || pulse.mod.length;

  if (reset) { // first-time or modifications present, reset index
    this._reset(_, pulse, output);
  } else { // otherwise perform incremental update
    this._update(_, pulse, output);
  }

  this._prevRange = _.range.slice();
  return output;
};

prototype._update = function(_, input, output) {
  var $ = _.field,
      range = _.range,
      index = this.value,
      prevRange = this._prevRange,
      add = function(t) { output.add.push(t); },
      rem = function(t) { output.rem.push(t); };

  input.rem.forEach(function(t) {
    if (inRange($(prev(t)), prevRange)) rem(t);
    index.remove(t);
  });

  if (_.modified('range')) {
    // map range values to sorted array indices
    var p0 = index.bisectLeft(prevRange[0]),
        p1 = index.bisectRight(prevRange[1]),
        r0 = index.bisectLeft(range[0]),
        r1 = index.bisectRight(range[1]);

    if (r0 > p1 || p0 > r1) { // no overlap
      index.visit(p0, p1, rem);
      index.visit(r0, r1, add);
    } else {
      if (p0 < r0) index.visit(p0, r0, rem);
      if (r0 < p0) index.visit(r0, p0, add);
      if (r1 < p1) index.visit(r1, p1, rem);
      if (p1 < r1) index.visit(p1, r1, add);
    }
  }

  input.add.forEach(function(t) {
    var v = $(t);
    if (inRange(v, range)) add(t);
    index.insert(v, t);
  });
};

prototype._reset = function(_, input, output) {
  var $ = _.field,
      range = _.range,
      index = this.value,
      prevRange = this._prevRange,
      prevMatch = {};

  // hash all tuples that currently match, then clear index
  // TODO: alternatively hash non-matches if smaller set?
  if (prevRange) {
    index.query(prevRange, function(t) { prevMatch[t._id] = t; });
    index.clear();
  }

  // process adds
  input.add.forEach(function(t) {
    var v = $(t);
    index.insert(v, t);
    if (inRange(v, range)) output.add.push(t);
  });

  // process rems
  input.rem.forEach(function(t) {
    if (prevMatch[t._id]) {
      prevMatch[t._id] = null;
      output.rem.push(t);
    }
  });

  // process mods and reflow
  function update(t) {
    var v = $(t),
        b = inRange(v, range),
        m = prevMatch[t._id];
    if (b) {
      (m ? output.mod : output.add).push(t);
    } else if (m) {
      output.rem.push(t);
      prevMatch[t._id] = null;
    }
    index.insert(v, t);
  }
  input.mod.forEach(update);
  input.reflow(_.source).forEach(update);
};

/*
prototype._transformOld = function(_, pulse) {
  var output = pulse.fork(),
      $ = _.field,
      range = _.range,
      index = this.value,
      prevRange = this._prevRange;

  function add(t) { output.add.push(t); }
  function rem(t) { output.rem.push(t); }

  if (prevRange == null) {
    this._init($, pulse);
    index.query(range[0], range[1], add);
  } else {
    if (_.modified('field')) {
      // TODO support complete operator reset?
      throw Error('RangeFilter does not support modifying the field parameter.');
    }

    pulse.rem.forEach(function(t) {
      if (inRange($(prev(t)), prevRange)) rem(t);
      index.remove(t);
    });

    // var mod = pulse.modified($.fields);
    // if (mod) {
    //   pulse.mod => if (inRange(...))
    // }

    if (_.modified('range')) {
      // updateRange(index, range, prevRange, add, rem);
      var p0 = index.bisectLeft(prevRange[0]),
          p1 = index.bisectRight(prevRange[1]),
          c0 = index.bisectLeft(range[0]),
          c1 = index.bisectRight(range[1]);

      if (c0 > p1 || p0 > c1) {
        // no overlap
        index.visit(p0, p1, rem);
        index.visit(c0, c1, add);
      } else {
        if (p0 < c0) index.visit(p0, c0, rem);
        if (c0 < p0) index.visit(c0, p0, add);
        if (c1 < p1) index.visit(c1, p1, rem);
        if (p1 < c1) index.visit(p1, c1, add);
      }
    }

    pulse.add.forEach(function(t) {
      var v = $(t);
      if (inRange(v, range)) add(t);
      index.insert(v, t);
    });
  }

  this._prevRange = range.slice();
  return output;
};

prototype._reset = function(_, output) {
  var $ = _.field,
      data = _.source,
      range = _.range,
      prevRange = this._prevRange,
      prevMatch = {},
      i, t, v;

  // hash-index all tuples that currently match
  index.query(prevRange[0], prevRange[1], function(t) {
    prevMatch[t._id] = t;
  });

  // clear list
  index.clear();

  // populate index and adds
  for (i=0; i<data.length; ++i) {
    t = data[i].v;
    v = $(t);
    index.insert(v, t);

    // if a tuple is in range, remove from hash-index
    if (!inRange(v, range)) continue;
    if (prevMatch[t._id]) {
      prevMatch[t._id] = null;
    } else {
      output.add.push(t);
    }
  }

  // push remaining hashed tuples into rem
  for (i in prevMatch) {
    t = prevMatch[i];
    if (t) output.rem.push(t);
  }
};
*/
/*
prototype._initialize = function(_, pulse, output) {
  var $ = _.field,
      index = this.value,
      iadd = function(t) { index.insert($(t), t); },
      irem = function(t) { index.remove(t); },
      mod = pulse.modified($.fields);

  // remove tuples and flush
  pulse.rem.forEach(irem);
  if (mod) pulse.mod.forEach(irem);
  index.flush();

  // add tuples
  pulse.add.forEach(iadd);
  if (mod) pulse.mod.forEach(iadd);

  index.query(range[0], range[1], function(t) { output.add.push(t); });
};
*/

