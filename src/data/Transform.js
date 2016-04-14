import Operator from '../Operator';

// Abstract class for operators that process data tuples.
export default function Transform(init, args) {
  Operator.call(this, init, null, args);
}

var prototype = (Transform.prototype = Object.create(Operator.prototype));
prototype.constructor = Transform;

prototype._evaluate = function(pulse) {
  var args = this.marshall(),
      out = this._transform(args, pulse);
  args.clear();
  return out;
};

// Subclasses can override to perform custom processing.
prototype._transform = function() {}
