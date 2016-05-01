import {array, visit} from './util/Arrays';
import UniqueList from './util/UniqueList';

export var StopPropagation = {};
export var ADD = 1;
export var REM = 2;
export var MOD = 4;
export var ALL = ADD | REM | MOD;
export var REFLOW = 8;

export default function Pulse(dataflow) {
  this.dataflow = dataflow;
  this.stamp = -1;
  this.add = [];
  this.rem = [];
  this.mod = [];
}

var prototype = Pulse.prototype;

prototype.StopPropagation = StopPropagation;
prototype.ADD = ADD;
prototype.REM = REM;
prototype.MOD = MOD;
prototype.ALL = ALL;
prototype.REFLOW = REFLOW;

// add accessors that run filters upon invocation?

prototype.fork = function(flags) {
  var p = new Pulse(this.dataflow);
  p.stamp = this.stamp;
  if (this.fields) p.fields = this.fields;
  if (flags) {
    if (flags & ADD) {
      p.add = this.add;
      if (this._addf) p._addf = this._addf;
    }
    if (flags & REM) {
      p.rem = this.rem;
      if (this._remf) p._remf = this._remf;
    }
    if (flags & MOD) {
      p.mod = this.mod;
      if (this._modf) p._modf = this._modf;
    }
  }
  return p;
};

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
  return !fields ? 0 : array(_).some(function(f) { return fields[f]; });
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

prototype.visit = function(flags, visitor, data) {
  if (flags & ADD) visit(this.add, this._addf, visitor);
  if (flags & REM) visit(this.rem, this._remf, visitor);
  if (flags & MOD) visit(this.mod, this._modf, visitor);

  if (flags & REFLOW) {
    var map = {};
    this.visit(ALL, function(t) { map[t._id] = 1; });
    visit(data, function(t) { return !map[t._id]; }, visitor);
  }

  return this;
};
