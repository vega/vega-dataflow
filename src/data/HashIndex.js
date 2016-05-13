import Transform from './Transform';
import {inherits} from '../util/Functions';

/**
 * Creates a hash index that maps from a field value to tuple. Assumes that
 * the field is a unique key, without duplicate values.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - An accessor for the field to index.
 */
export default function HashIndex(params) {
  Transform.call(this, {}, params);
}

var prototype = inherits(HashIndex, Transform);

prototype.transform = function(_, pulse) {
  var field = _.field,
      index = this.value,
      flag = pulse.ADD;

  function set(t) { index[field(t)] = t; }

  if (_.modified('field')) {
    this.value = index = {};
    pulse.visit(pulse.SOURCE, set);
  } else {
    flag |= pulse.modified(field.fields) ? pulse.MOD : 0;
    pulse.visit(flag, set);
  }

  return pulse;
};
