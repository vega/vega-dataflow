import Transform from './Transform';
import {set} from '../Tuple';

// Applies a function to a data tuple and stores the result.
// The 'apply' parameter provides the function to apply.
// The 'field' parameter indicates the field under which to store the result.
export default function Apply(params) {
  Transform.call(this, null, params);
}

var prototype = (Apply.prototype = Object.create(Transform.prototype));
prototype.constructor = Apply;

prototype._transform = function(_, pulse) {
  var func = _.apply,
      field = _.field,
      flags = pulse.ADD | (pulse.modified(func.fields) ? pulse.MOD : 0);

  return pulse
    .visit(flags, function(t) { set(t, field, func(t)); })
    .modifies(field);
};
