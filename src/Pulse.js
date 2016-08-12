import {array, isArray, visitArray} from 'vega-util';

/**
 * Sentinel value indicating pulse propagation should stop.
 */
export var StopPropagation = {};

// Pulse visit type flags
var ADD       = (1 << 0),
    REM       = (1 << 1),
    MOD       = (1 << 2),
    ADD_REM   = ADD | REM,
    ADD_MOD   = ADD | MOD,
    ALL       = ADD | REM | MOD,
    REFLOW    = (1 << 3),
    SOURCE    = (1 << 4),
    NO_SOURCE = (1 << 5);

/**
 * A Pulse enables inter-operator communication during a run of the
 * dataflow graph. In addition to the current timestamp, a pulse may also
 * contain a change-set of added, removed or modified data tuples, as well as
 * a pointer to a full backing data source. Tuple change sets may not
 * be fully materialized; for example, to prevent needless array creation
 * a change set may include larger arrays and corresponding filter functions.
 * The pulse provides a {@link visit} method to enable proper and efficient
 * iteration over requested data tuples.
 *
 * In addition, each pulse can track modification flags for data tuple fields.
 * Responsible transform operators should call the {@link modifies} method to
 * indicate changes to data fields. The {@link modified} method enables
 * querying of this modification state.
 *
 * @constructor
 * @param {Dataflow} dataflow - The backing dataflow instance.
 */
export default function Pulse(dataflow, stamp, encode) {
  this.dataflow = dataflow;
  this.stamp = stamp == null ? -1 : stamp;
  this.add = [];
  this.rem = [];
  this.mod = [];
  this.fields = null;
  this.encode = encode || null;
}

var prototype = Pulse.prototype;

/**
 * Sentinel value indicating pulse propagation should stop.
 */
prototype.StopPropagation = StopPropagation;

/**
 * Boolean flag indicating ADD (added) tuples.
 */
prototype.ADD = ADD;

/**
 * Boolean flag indicating REM (removed) tuples.
 */
prototype.REM = REM;

/**
 * Boolean flag indicating MOD (modified) tuples.
 */
prototype.MOD = MOD;

/**
 * Boolean flag indicating ADD (added) and REM (removed) tuples.
 */
prototype.ADD_REM = ADD_REM;

/**
 * Boolean flag indicating ADD (added) and MOD (modified) tuples.
 */
prototype.ADD_MOD = ADD_MOD;

/**
 * Boolean flag indicating ADD, REM and MOD tuples.
 */
prototype.ALL = ALL;

/**
 * Boolean flag indicating all tuples in a data source
 * except for the ADD, REM and MOD tuples.
 */
prototype.REFLOW = REFLOW;

/**
 * Boolean flag indicating a 'pass-through' to a
 * backing data source, ignoring ADD, REM and MOD tuples.
 */
prototype.SOURCE = SOURCE;

/**
 * Boolean flag indicating that source data should be
 * suppressed when creating a forked pulse.
 */
prototype.NO_SOURCE = NO_SOURCE;

/**
 * Creates a new pulse based on the values of this pulse.
 * The dataflow, time stamp and field modification values are copied over.
 * By default, new empty ADD, REM and MOD arrays are created.
 * @param {number} flags - Integer of boolean flags indicating which (if any)
 *   tuple arrays should be copied to the new pulse. The supported flag values
 *   are ADD, REM and MOD. Array references are copied directly: new array
 *   instances are not created.
 * @return {Pulse}
 * @see init
 */
prototype.fork = function(flags) {
  return new Pulse(this.dataflow).init(this, flags);
};

/**
 * Initialize this pulse based on the values of another pulse. This method
 * is used internally by {@link fork} to initialize a new forked tuple.
 * The dataflow, time stamp and field modification values are copied over.
 * By default, new empty ADD, REM and MOD arrays are created.
 * @param {Pulse} src - The source pulse to copy from.
 * @param {number} flags - Integer of boolean flags indicating which (if any)
 *   tuple arrays should be copied to the new pulse. The supported flag values
 *   are ADD, REM and MOD. Array references are copied directly: new array
 *   instances are not created. By default, source data arrays are copied
 *   to the new pulse. Use the NO_SOURCE flag to enforce a null source.
 * @return {Pulse}
 */
prototype.init = function(src, flags) {
  var p = this;
  p.stamp = src.stamp;
  p.source = (flags & NO_SOURCE) ? null : src.source;
  p.encode = src.encode;
  if (src.fields) p.fields = src.fields;
  p.add = (flags & ADD) ? (p.addF = src.addF, src.add) : (p.addF = null, []);
  p.rem = (flags & REM) ? (p.remF = src.remF, src.rem) : (p.remF = null, []);
  p.mod = (flags & MOD) ? (p.modF = src.modF, src.mod) : (p.modF = null, []);
  return p;
};

/**
 * Schedules a function to run after pulse propagation completes.
 * @param {function} func - The function to run.
 */
prototype.runAfter = function(func) {
  this.dataflow.runAfter(func);
};

prototype.changed = function(flags) {
  var f = flags || ALL;
  return ((f & ADD) && this.add.length)
      || ((f & REM) && this.rem.length)
      || ((f & MOD) && this.mod.length);
};

prototype.reflow = function() {
  var len = this.add.length,
      src = this.source && this.source.length;
  if (src && src !== len) {
    this.mod = this.source;
    if (len) this.filter(MOD, filter(this, ADD));
  }
  return this;
};

prototype.modifies = function(_) {
  var fields = array(_),
      hash = this.fields || (this.fields = {});
  fields.forEach(function(f) { hash[f] = true; });
  return this;
};

prototype.modified = function(_) {
  var fields = this.fields;
  return !(this.mod.length && fields) ? false
    : !arguments.length ? !!fields
    : isArray(_) ? _.some(function(f) { return fields[f]; })
    : fields[_];
};

prototype.filter = function(flags, filter) {
  var p = this;
  if (flags & ADD) p.addF = addFilter(p.addF, filter);
  if (flags & REM) p.remF = addFilter(p.remF, filter);
  if (flags & MOD) p.modF = addFilter(p.modF, filter);
  return p;
};

function addFilter(a, b) {
  return a ? function(t,i) { return a(t,i) && b(t,i); } : b;
}

prototype.materialize = function(flags) {
  flags = flags || ALL;
  var p = this;
  if ((flags & ADD) && p.addF) { p.add = p.add.filter(p.addF); p.addF = null; }
  if ((flags & REM) && p.remF) { p.rem = p.rem.filter(p.remF); p.remF = null; }
  if ((flags & MOD) && p.modF) { p.mod = p.mod.filter(p.modF); p.modF = null; }
  return p;
};

function filter(pulse, flags) {
  var map = {};
  pulse.visit(flags, function(t) { map[t._id] = 1; });
  return function(t) { return map[t._id] ? null : t; };
}

prototype.visit = function(flags, visitor) {
  if (flags & SOURCE) {
    this.source.forEach(visitor);
    return this;
  }

  var v = visitor, src, sum;
  if (flags & ADD) visitArray(this.add, this.addF, v);
  if (flags & REM) visitArray(this.rem, this.remF, v);
  if (flags & MOD) visitArray(this.mod, this.modF, v);

  if ((flags & REFLOW) && (src = this.source)) {
    sum = this.add.length + this.mod.length;
    if (sum === src) {
      // do nothing
    } else if (sum) {
      visitArray(src, filter(this, ADD_MOD), v);
    } else {
      // if no add/rem/mod tuples, iterate directly
      src.forEach(visitor);
    }
  }

  return this;
};
