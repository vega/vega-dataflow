import UniqueList from './util/UniqueList';
import ModMap from './util/ModMap';

export var OP_ID = 0;
var EMPTY_ARGS = new ModMap();

export default function Operator(init, fn, args) {
  this.id = ++OP_ID;
  this.stamp = -1;
  this.rank = -1;
  this.qrank = -1;
  this.value = init;
  this.targets = UniqueList();
  if (fn) {
    this._fn = fn;
    this._skip = false;
  }
  if (args) this.parameters(args);
}

var prototype = Operator.prototype;

prototype.set = function(_) {
  return this.value !== _ ? (this.value = _, 1) : 0;
};

prototype.skip = function() {
  this._skip = true;
};

prototype.parameters = function(args) {
  this._argval = this._argval || new ModMap();
  this._argops = this._argops || [];

  for (var name in args) {
    var val = args[name];
    if (val instanceof Operator) {
      val.targets.add(this);
      this._argops.push({name:name, op:val});
    } else {
      this._argval[name] = val;
    }
  }

  return this;
};

prototype.marshall = function() {
  var val = this._argval || EMPTY_ARGS,
      ops = this._argops, i, n;

  if (ops && (n = ops.length)) {
    for (i=0; i<n; ++i) {
      val.set(ops[i].name, ops[i].op.value);
    }
  }
  return val;
};

// Subclasses can override to perform custom processing.
prototype._evaluate = function(pulse) {
  if (this._fn && !this._skip) {
    var args = this.marshall(),
        v = this._fn(args, pulse);

    args.clear();
    if (v !== this.value) {
      this.value = v;
    } else {
      return pulse.StopPropagation;
    }
  }
};

// Evaluate this operator for the current pulse.
prototype.evaluate = function(pulse) {
  if (pulse.stamp <= this.stamp) return pulse.StopPropagation;
  var rv = this._evaluate(pulse) || pulse;
  this.stamp = pulse.stamp;
  this._skip = false;
  return rv;
};
