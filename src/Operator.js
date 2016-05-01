import UniqueList from './util/UniqueList';
import Parameters from './util/Parameters';

export var OP_ID = 0;
var NO_PARAMS = new Parameters();

export default function Operator(init, fn, params) {
  this.id = ++OP_ID;
  this.stamp = -1;
  this.rank = -1;
  this.value = init;
  this.targets = UniqueList();
  if (fn) {
    this._fn = fn;
    this._skip = false;
  }
  if (params) this.parameters(params);
}

var prototype = Operator.prototype;

prototype.set = function(_) {
  return this.value !== _ ? (this.value = _, 1) : 0;
};

prototype.skip = function() {
  this._skip = true;
};

prototype.parameters = function(params) {
  var self = this,
      argval = (self._argval = self._argval || new Parameters()),
      argops = (self._argops = self._argops || []),
      name, value, pulse, n, i;

  function add(name, value, index, pulse) {
    // TODO revisit parse rules to access operator pulse (or other properties?)
    if (value instanceof Operator) {
      value.targets.add(self);
      argops.push({op:value, name:name, index:index, pulse:pulse});
    } else {
      argval.set(name, value, index);
    }
    if (name === 'source' && index < 0) {
      self.source = value;
    }
  }

  for (name in params) {
    value = params[name];
    pulse = (name[0] === '!') ? (name = name.slice(1), 1) : 0;

    if (Array.isArray(value)) {
      argval.set(name, Array(n = value.length), -1, pulse);
      for (i=0; i<n; ++i) add(name, value[i], i, pulse);
    } else {
      add(name, value, -1, pulse);
    }
  }

  return self;
};

prototype.marshall = function() {
  var argval = this._argval || NO_PARAMS,
      argops = this._argops, item, value, i, n;

  if (argops && (n = argops.length)) {
    for (i=0; i<n; ++i) {
      item = argops[i];
      value = item.pulse ? item.op.pulse : item.op.value;
      argval.set(item.name, value, item.index);
    }
  }
  return argval;
};

// Subclasses can override to perform custom processing.
prototype._evaluate = function(pulse) {
  if (this._fn && !this._skip) {
    var params = this.marshall(),
        v = this._fn(params, pulse);

    params.clear();
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
  return (this._skip = false, this.pulse = rv);
};
