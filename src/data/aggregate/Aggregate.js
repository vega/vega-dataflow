import Transform from '../../Transform';
import TupleStore from './TupleStore';
import {createMeasure, compileMeasures} from './Measures';
import {ingest, prev, prev_init} from '../../Tuple';
import {inherits, fname} from '../../util/Functions';
import {array} from '../../util/Arrays';
import {error} from '../../util/Errors';

export var VALID_AGGREGATES = [
  'values', 'count', 'valid', 'missing', 'distinct',
  'sum', 'mean', 'average', 'variance', 'variancep', 'stdev',
  'stdevp', 'median', 'q1', 'q3', 'modeskew', 'min', 'max',
  'argmin', 'argmax'
];

/**
 * Group-by aggregation operator.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<function(object): *>} params.groupby - An array of accessors to groupby.
 * @param {Array<function(object): *>} params.fields - An array of accessors to aggregate.
 * @param {Array<string>} params.ops - An array of strings indicating aggregation operations.
 * @param {Array<string>} [params.as] - An array of output field names for aggregated values.
 * @param {boolean} [params.keep=false] - A flag indicating if empty cells should be kept.
 */
export default function Aggregate(params) {
  Transform.call(this, null, params);

  this._adds = []; // array of added output tuples
  this._mods = []; // array of modified output tuples
  this._alen = 0;  // number of active added tuples
  this._mlen = 0;  // number of active modified tuples

  this._dims = [];   // group-by dimension accessors
  this._dnames = []; // group-by dimension names

  this._measures = []; // collection of aggregation monoids
  this._count = false; // flag indicating only count aggregation

  this._inputs = null;  // array of dependent input tuple field names
  this._outputs = null; // array of output tuple field names
}

var prototype = inherits(Aggregate, Transform);

prototype.transform = function(_, pulse) {
  var aggr = this,
      out = pulse.fork(),
      stamp = out.stamp;

  if (this.value && _.modified()) {
    this.removeAll(out);

    this.init(_);

    pulse.visit(pulse.SOURCE, function(t) {
      aggr.add(t, out);
    });
  } else {
    if (this.value == null) {
      this.init(_);
    }

    pulse.visit(pulse.ADD, function(t) {
      aggr.add(t, out);
    });

    pulse.visit(pulse.REM, function(t) {
      aggr.rem(prev(t, stamp), out);
    });

    if (this._inputs && pulse.modified(this._inputs)) {
      pulse.visit(pulse.MOD, function(t) {
        aggr.mod(t, prev(t, stamp), out);
      });
    }
  }

  // Indicate output fields and return aggregate tuples.
  out.modifies(this._outputs);
  return aggr.changes(_, out);
};

prototype.init = function(_) {
  // initialize input and output fields
  var inputs = (this._inputs = []),
      outputs = (this._outputs = []),
      inputMap = {};

  function inputVisit(get) {
    var fields = get.fields, i = 0, n = fields.length, f;
    for (; i<n; ++i) {
      if (!inputMap[f=fields[i]]) {
        inputMap[f] = 1;
        inputs.push(f);
      }
    }
  }

  // initialize group-by dimensions
  this._dims = array(_.groupby);
  this._dnames = this._dims.map(function(d) {
    var dname = fname(d)
    return (inputVisit(d), outputs.push(dname), dname);
  });
  this.cellkey = _.key ? _.key
    : this._dims.length === 0 ? function() { return ''; }
    : this._dims.length === 1 ? this._dims[0]
    : cellkey;

  // initialize aggregate measures
  this._count = true;
  this._measures = [];

  var fields = _.fields || [null],
      ops = _.ops || ['count'],
      as = _.as || [],
      n = fields.length,
      map = {},
      field, op, m, mname, outname, i;

  if (n !== ops.length) {
    error('There must be the same number of fields and aggregate ops.');
  }

  for (i=0; i<n; ++i) {
    field = fields[i];
    op = ops[i];

    mname = fname(field);
    outname = measureName(op, mname, as[i]);
    outputs.push(outname);
    if (!field) continue;

    m = map[mname];
    if (!m) {
      inputVisit(field);
      m = (map[mname] = []);
      m.field = field;
      this._measures.push(m);
    }

    if (op !== 'count') this._count = false;
    m.push(createMeasure(op, outname));
  }

  this._measures = this._measures.map(function(m) {
    return compileMeasures(m, m.field);
  });

  this.value = {}; // aggregation cells
};

function measureName(op, mname, as) {
  return as || (op + (!mname ? '' : '_' + mname));
}

// -- Cell Management -----

function cellkey(x) {
  var d = this._dims,
      n = d.length, i,
      k = String(d[0](x));

  for (i=1; i<n; ++i) {
    k += '|' + d[i](x);
  }

  return k;
}

prototype.cellkey = cellkey;

prototype.cell = function(t, out) {
  var key = this.cellkey(t),
      cell = this.value[key],
      stamp = out.stamp;

  if (!cell) {
    cell = this.value[key] = this.newcell(t, stamp);
    this._adds[this._alen++] = cell;
  } else if (cell.stamp < stamp) {
    cell.stamp = stamp;
    this._mods[this._mlen++] = cell;
  }
  return cell;
};

prototype.newcell = function(t, stamp) {
  var cell = {
    num:   0,
    agg:   null,
    tuple: this.newtuple(t),
    stamp: stamp,
    store: false
  };

  if (!this._count) {
    var measures = this._measures,
        n = measures.length, i;

    cell.agg = Array(n);
    for (i=0; i<n; ++i) {
      cell.agg[i] = new measures[i](cell, cell.tuple);
    }
  }

  if (cell.store) {
    cell.data = new TupleStore();
  }

  return cell;
};

prototype.newtuple = function(t) {
  var names = this._dnames,
      dims = this._dims,
      x = {}, i, n;

  for (i=0, n=dims.length; i<n; ++i) {
    x[names[i]] = dims[i](t);
  }

  return ingest(x);
};

// -- Process Tuples -----

prototype.add = function(t, out) {
  var cell = this.cell(t, out);
  cell.num += 1;
  if (this._count) return;

  if (cell.store) cell.data.add(t);

  var agg = cell.agg, i, n;
  for (i=0, n=agg.length; i<n; ++i) {
    agg[i].add(t);
  }
};

prototype.rem = function(t, out) {
  var cell = this.cell(t, out);
  cell.num -= 1;
  if (this._count) return;

  if (cell.store) cell.data.rem(t);

  var agg = cell.agg, i, n;
  for (i=0, n=agg.length; i<n; ++i) {
    agg[i].rem(t);
  }
};

prototype.mod = function(t, s, out) {
  var cell0 = this.cell(s, out),
      cell1 = this.cell(t, out);

  if (cell0 !== cell1) {
    cell0.num -= 1;
    cell1.num += 1;
    if (cell0.store) cell0.data.rem(s);
    if (cell1.store) cell1.data.add(t);
  }
  if (this._count) return;

  var agg0 = cell0.agg,
      agg1 = cell1.agg, i, n;
  for (i=0, n=agg0.length; i<n; ++i) {
    agg0[i].rem(s);
    agg1[i].add(t);
  }
};

prototype.celltuple = function(cell) {
  var tuple = cell.tuple, agg, i, n;

  // consolidate stored values
  if (cell.store) {
    cell.data.values();
  }

  // update tuple properties
  if (this._count) {
    tuple.count = cell.num;
  } else {
    agg = cell.agg;
    for (i=0, n=agg.length; i<n; ++i) {
      agg[i].set();
    }
  }

  return tuple;
};

prototype.changes = function(_, out) {
  var adds = this._adds,
      mods = this._mods,
      cell, t, i, n;

  for (i=0, n=this._alen; i<n; ++i) {
    out.add.push(this.celltuple(adds[i]));
    adds[i] = null; // for garbage collection
  }

  for (i=0, n=this._mlen; i<n; ++i) {
    cell = mods[i];
    prev_init(cell.tuple, out.stamp);
    t = this.celltuple(cell);

    if (cell.num == 0 && (_.drop == null || _.drop)) {
      out.rem.push(t);
    } else {
      out.mod.push(t);
    }

    mods[i] = null; // for garbage collection
  }

  this._alen = this._mlen = 0; // reset list of active cells
  return out;
};

prototype.removeAll = function(out) {
  var cells = this.value, key;
  for (key in cells) {
    out.rem.push(cells[key].tuple);
  }
};
