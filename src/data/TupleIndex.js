import Transform from '../Transform';
import {inherits} from 'vega-util';
import {map} from 'd3-collection';

/**
 * An index that maps from unique, string-coerced, field values to tuples.
 * Assumes that the field serves as a unique key with no duplicate values.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The field accessor to index.
 */
export default function TupleIndex(params) {
  Transform.call(this, map(), params);
}

var prototype = inherits(TupleIndex, Transform);

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
