import Operator from '../Operator';

// Abstract class for operators that process data tuples.
export default function Transform(init, params) {
  Operator.call(this, init, null, params);
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
prototype._transform = function() {};
