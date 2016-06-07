import Transform from '../Transform';
import {inherits} from '../util/Functions';

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

var prototype = inherits(Apply, Transform);

prototype.transform = function(_, pulse) {
  var func = _.apply,
      field = _.field,
      flags;

  function set(t) {
    t[field] = func(t, _);
  }

  if (_.modified()) {
    // parameters updated, need to reflow
    pulse
      .materialize()
      .visit(pulse.ADD | pulse.MOD, set)
      .visit(pulse.REFLOW, function(t) { set(t); pulse.mod.push(t); });
  } else {
    flags = pulse.ADD | (pulse.modified(func.fields) ? pulse.MOD : 0);
    pulse.visit(flags, set);
  }

  return pulse.modifies(field);
};
