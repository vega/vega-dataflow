import Transform from '../Transform';
import {inherits} from '../util/Functions';

import {map} from 'd3-collection';

/**
 * An index that counts occurrences of field values. The resulting operator
 * value is a map from string-coerced field values to integer counts.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The field accessor to index.
 */
export default function CountIndex(params) {
  Transform.call(this, map(), params);
}

var prototype = inherits(CountIndex, Transform);

prototype.transform = function(_, pulse) {
  var field = _.field,
      index = this.value,
      mod = true;

  function add(t) {
    var v = field(t);
    index.set(v, 1 + (+index.get(v) || 0));
  }

  function rem(t) {
    var v = field(t), c = index.get(v) - 1;
    if (c > 0) {
      index.set(v, c);
    } else {
      index.remove(v);
    }
  }

  if (_.modified('field') || pulse.modified(field.fields)) {
    this.value = index = map();
    pulse.visit(pulse.SOURCE, add);
  } else if (pulse.changed(pulse.ADD_REM)) {
    pulse.visit(pulse.ADD, add);
    pulse.visit(pulse.REM, rem);
  } else {
    mod = false;
  }

  this.modified(mod);
  return pulse;
};
