import Transform from './Transform';
import {set} from '../Tuple';

/**
 * Applies a function to a data tuple and stores the result.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.apply - The function to apply to each tuple.
 * @param {string} params.field - the field under which to store the result.
 */
export default function Apply(params) {
  Transform.call(this, null, params);
}

var prototype = (Apply.prototype = Object.create(Transform.prototype));
prototype.constructor = Apply;

prototype.transform = function(_, pulse) {
  var func = _.apply,
      field = _.field,
      flags = pulse.ADD | (pulse.modified(func.fields) ? pulse.MOD : 0);

  return pulse
    .visit(flags, function(t) { set(t, field, func(t)); })
    .modifies(field);
};
