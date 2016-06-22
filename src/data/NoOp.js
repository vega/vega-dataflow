import Transform from '../Transform';
import {inherits} from '../util/Functions';

/**
 * Propagates a pulse with no modifications.
 * @constructor
 */
export default function NoOp(params) {
  Transform.call(this, {}, params);
}

var prototype = inherits(NoOp, Transform);

prototype.transform = function(_, pulse) {
  return pulse;
};
