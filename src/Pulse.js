import UniqueList from './util/UniqueList';
import {array, visit} from './util/Arrays';
import {prev} from './Tuple';

/**
 * Sentinel value indicating pulse propagation should stop.
 */
export var StopPropagation = {};

// Pulse visit type flags
var ADD    = (1 << 0),
    REM    = (1 << 1),
    MOD    = (1 << 2),
    REFLOW = (1 << 3),
    SOURCE = (1 << 4),
    PREV   = (1 << 5),
    ALL    = ADD | REM | MOD;

/**
 * Create a new pulse instance.
 * @constructor
 * @param {Dataflow} dataflow - The backing dataflow instance.
 */
export default function Pulse(dataflow) {
  this.dataflow = dataflow;
  this.stamp = -1;
  this.add = [];
  this.rem = [];
  this.mod = [];
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
 * Boolean flag indicating previous tuple values. Can be used in
 * conjunction with others (e.g., MOD) to target previous tuple values.
 */
prototype.PREV = PREV;

/**
 * Creates a new pulse based on the values of this pulse.
 * The dataflow, time stamp and field modification values are copied over.
 * By default, new empty ADD, REM and MOD arrays are created.
 * @param {number} flags - Integer of boolean flags indicating which (if any)
 *   tuple arrays should be copied to the new pulse. The supported flag values
 *   are ADD, REM and MOD. Array references are copied directly: new array
 *   instances are not created.
 * @return {Pulse}
 */
prototype.fork = function(flags) {
  return new Pulse(this.dataflow).init(this, flags);
};

prototype.init = function(pulse, flags) {
  this.stamp = pulse.stamp;
  this.source = pulse.source;
  if (pulse.fields) this.fields = pulse.fields;

  if (flags & ADD) {
    this.add = pulse.add;
    if (pulse._addf) this._addf = pulse._addf;
  } else {
    this.add = [];
    if (this._addf) this._addf = null;
  }

  if (flags & REM) {
    this.rem = pulse.rem;
    if (pulse._remf) this._remf = pulse._remf;
  } else {
    this.rem = [];
    if (this._remf) this._remf = null;
  }

  if (flags & MOD) {
    this.mod = pulse.mod;
    if (pulse._modf) this._modf = pulse._modf;
  } else {
    this.mod = [];
    if (this._modf) this._modf = null;
  }

  return this;
};

/**
 * Returns the list of queued operators for the current propagation.
 * If the list does not exist, it is created by this list.
 * @return {UniqueList}
 */
prototype.operators = function() {
  return this._ops || (this._ops = UniqueList());
};

prototype.modifies = function(_) {
  var fields = array(_),
      hash = this.fields || (this.fields = {});
  fields.forEach(function(f) { hash[f] = 1; });
  return this;
};

prototype.modified = function(_) {
  var fields = this.fields;
  return !fields ? 0
    : Array.isArray(_) ? _.some(function(f) { return fields[f]; })
    : fields[_];
};

prototype.materialize = function(flags) {
  flags = flags || ALL;
  if ((flags & ADD) && this._addf) {
    this.add = this.add.filter(this._addf);
    this._addf = null;
  }
  if ((flags & REM) && this._remf) {
    this.rem = this.rem.filter(this._remf);
    this._remf = null;
  }
  if ((flags & MOD) && this._modf) {
    this.mod = this.mod.filter(this._modf);
    this._modf = null;
  }
  return this;
};

prototype.filter = function(flags, filter) {
  if (flags & ADD) this._addf = andf(filter, this._addf);
  if (flags & REM) this._remf = andf(filter, this._remf);
  if (flags & MOD) this._modf = andf(filter, this._modf);
  return this;
};

function andf(f1, f2) {
  return !f2 ? f1 : function(t, i) { return f1(t,i) && f2(t,i); };
}

prototype.visit = function(flags, visitor) {
  if (flags & SOURCE) {
    this.source.forEach(visitor);
    return this;
  }

  var s = this.stamp,
      v = flags & PREV ? function(t,i) { visitor(prev(t,s), i); } : visitor;

  if (flags & ADD) visit(this.add, this._addf, v);
  if (flags & REM) visit(this.rem, this._remf, v);
  if (flags & MOD) visit(this.mod, this._modf, v);

  if (flags & REFLOW) {
    var map = {};
    this.visit(ALL, function(t) { map[t._id] = 1; });
    visit(this.source, function(t) { return !map[t._id]; }, v);
  }

  return this;
};
