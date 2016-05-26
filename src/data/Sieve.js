import Transform from './Transform';
import {inherits} from '../util/Functions';

/**
 * Propagates a new pulse without any tuples so long as the input
 * pulse contains some added, removed or modified tuples.
 * @constructor
 */
export default function Sieve(params) {
  Transform.call(this, null, params);
  this.modified(true); // always treat as modified
}

var prototype = inherits(Sieve, Transform);

prototype.transform = function(_, pulse) {
  return pulse.changed()
    ? pulse.fork()
    : pulse.StopPropagation;
};
