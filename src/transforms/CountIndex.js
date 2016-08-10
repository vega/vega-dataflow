import Transform from '../Transform';
import {inherits} from 'vega-util';

/**
 * An index that counts occurrences of field values. The resulting operator
 * value is an object mapping string-coerced field values to integer counts.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The field accessor to index.
 */
export default function CountIndex(params) {
  Transform.call(this, {}, params);
}

var prototype = inherits(CountIndex, Transform);

prototype.transform = function(_, pulse) {
  var field = _.field,
      index = this.value,
      mod = true;

  function add(t) {
    var v = field(t);
    index[v] = 1 + (+index[v] || 0);
  }

  function rem(t) {
    index[field(t)] -= 1;
  }

  if (_.modified('field') || pulse.modified(field.fields)) {
    this.value = index = {};
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
