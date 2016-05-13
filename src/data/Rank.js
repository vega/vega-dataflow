import Transform from './Transform';
import {inherits} from '../util/Functions';
import {error} from '../util/Errors';

/**
 * Compute rank order scores for tuples. The tuples are assumed to have been
 * sorted in the desired rank orderby an upstream data source.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - An accessor for the field to rank.
 * @param {boolean} params.normalize - Boolean flag for normalizing rank values.
 *   If true, the integer rank scores are normalized to range [0, 1].
 */
export default function Rank(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(Rank, Transform);

prototype.transform = function(_, pulse) {
  if (!pulse.source) error('Rank transform requires an upstream data source.');

  var norm  = _.normalize,
      field = _.field,
      keys = {},
      n = pulse.source.length,
      klen = 0;

  if (field) {
    // If we have a field accessor, first compile distinct keys.
    pulse.visit(pulse.SOURCE, function(t) {
      var v = field(t);
      if (!keys[v]) keys[v] = ++klen;
    });
    pulse.visit(pulse.SOURCE, function(t) {
      var v = keys[field(t)];
      t.rank = norm ? v / klen : v / n;
    });
  } else {
    // Otherwise rank all the tuples together.
     pulse.visit(pulse.SOURCE, function(t, i) {
      t.rank = norm ? (i+1) / klen : (i+1) / n;
    });
  }

  return pulse.modifies(field.fields);
};
