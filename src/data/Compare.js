import Operator from '../Operator';
import {inherits, compare} from '../util/Functions';

/**
 * Generates a comparator function.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<function(object): *>} params.fields - The fields to compare.
 * @param {Array<string>} [params.orders] - The sort orders.
 *   Each entry should be one of "ascending" (default) or "descending".
 */
export default function Compare(params) {
  Operator.call(this, null, update, params);
}

inherits(Compare, Operator);

function update(_) {
  if (this.value != null && !_.modified()) {
    return this.value;
  }
  return compare(_.fields, _.orders);
}
