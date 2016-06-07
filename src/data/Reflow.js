import Transform from '../Transform';
import {inherits} from '../util/Functions';

/**
 * Reflows all tuples if any parameter changes.
 * @constructor
 * @param {object} params - The parameters for this operator.
 */
export default function Reflow(params) {
  Transform.call(this, null, params);
}

inherits(Reflow, Transform);

Reflow.prototype.transform = function(_, pulse) {
  return _.modified() ? pulse.reflow() : pulse;
};
