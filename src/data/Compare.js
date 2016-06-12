import Operator from '../Operator';
import {inherits, compare} from '../util/Functions';

/**
 * Generates a comparator function.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {string} params.fields - The field name to access.
 * @param {string} params.as - The accessor function name.
 */
export default function Compare(params) {
  Operator.call(this, null, update, params);
}

inherits(Compare, Operator);

function update(_) {
  if (this.value != null && !_.modified()) {
    return this.value;
  }
  return compare(_.fields ? _.fields
    : (_.order === 'descending' ? '-' : '')
      + (_.op ? _.op : '')
      + (_.field ? (_.op ? '_' : '') + _.field : ''));
}
