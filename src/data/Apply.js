import Transform from '../Transform';
import {inherits} from '../util/Functions';

/**
 * Applies a function to a data tuple and stores the result.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.apply - The function to apply to each tuple.
 * @param {string} params.as - The field name under which to store the result.
 */
export default function Apply(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(Apply, Transform);

prototype.transform = function(_, pulse) {
  var func = _.apply,
      field = _.as,
      mod;

  function set(t) {
    t[field] = func(t, _);
  }

  if (_.modified()) {
    // parameters updated, need to reflow
    pulse.materialize().reflow().visit(pulse.SOURCE, set);
  } else {
    mod = pulse.modified(func.fields);
    pulse.visit(mod ? pulse.ADD_MOD : pulse.ADD, set);
  }

  return pulse.modifies(field);
};
