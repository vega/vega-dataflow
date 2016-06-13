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
  return (this.value && !_.modified())
    ? this.value
    : compare(_.fields, _.orders);
}
