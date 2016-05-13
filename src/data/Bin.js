import Operator from '../Operator';
import {inherits, accessor, name} from '../util/Functions';
import bin from '../util/Bin';

/**
 * Generates a binning function for discretizing data.
 * @constructor
 * @param {object} params - The parameters for this operator. The
 *   provided values should be valid options for the {@link bin} function.
 * @param {function(object): *} params.field - The data field to bin.
 */
export default function Bin(params) {
  Operator.call(this, null, update, params);
}

inherits(Bin, Operator);

function update(_) {
  if (this.value != null && !_.modified()) {
    return this.value;
  }

  var field = _.field,
      bins  = bin(_),
      start = bins.start,
      step  = bins.step;

  var f = function(t) {
    var v = field(t);
    return v == null ? null
      : start + step * ~~((+v - start) / step);
  };
  return accessor(f, _.name || 'bin_' + name(field), field.fields);
}
