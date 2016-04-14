import Transform from './Transform';
import {set} from '../Tuple';

// Applies a function to a data tuple and stores the result.
// The 'func' parameter provides the function to apply.
// The 'field' parameter indicates the field under which to store the result.
export default function Apply(args) {
  Transform.call(this, null, args);
}

var prototype = (Apply.prototype = Object.create(Transform.prototype));
prototype.constructor = Apply;

prototype._transform = function(_, pulse) {
  var field = _.field,
      func = _.func;

  function apply(t) {
    set(t, field, func(t));
  }

  pulse.add.forEach(apply);

  if (pulse.modified(func.fields)) {
    pulse.mod.forEach(apply);
  }

  return pulse.modifies(field);
};
