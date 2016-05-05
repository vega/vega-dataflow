import Operator from '../Operator';

/**
 * Provides a bridge between a parent transform and a subflow that
 * consumes only a subset of the tuples that pass through the parent.
 */
export default function Subflow(pulse, parent, target) {
  Operator.call(this, pulse);
  this.parent = parent;
  this.target = target;
}

var prototype = (Subflow.prototype = Object.create(Operator.prototype));
prototype.constructor = Subflow;

prototype.add = function(t) { this.value.add.push(t); };
prototype.mod = function(t) { this.value.mod.push(t); };
prototype.rem = function(t) { this.value.rem.push(t); };

prototype.touch = function(pulse) { this.value.init(pulse); };

prototype._evaluate = function() {
  var p = this.value;
  return (p.add.length || p.rem.length || p.mod.length) ? p : p.StopPropagation;
};

prototype.connect = function() {
  this.target.source = this;
  this.targets().add(this.target);
  this.parent.targets().add(this);
  return this;
};

prototype.disconnect = function() {
  this.parent.targets().remove(this);
  return this;
};
