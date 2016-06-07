import Transform from '../Transform';
import {inherits} from '../util/Functions';

import {map} from 'd3-collection';

/**
 * Creates a hash index that maps from a field value to tuple. Assumes that
 * the field is a unique key, without duplicate values.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - An accessor for the field to index.
 */
export default function HashIndex(params) {
  Transform.call(this, map(), params);
}

var prototype = inherits(HashIndex, Transform);

prototype.transform = function(_, pulse) {
  var field = _.field,
      index = this.value,
      mod = true;

  function set(t) { index.set(field(t), t); }

  if (_.modified('field') || pulse.modified(field.fields)) {
    this.value = index = map();
    pulse.visit(pulse.SOURCE, set);
  } else if (pulse.changed()) {
    pulse.visit(pulse.ADD, set);
    pulse.visit(pulse.REM, function(t) { index.remove(field(t)); });
  } else {
    mod = false;
  }

  this.modified(mod);
  return pulse;
};
