import Transform from './Transform';
import {inherits} from '../util/Functions';

 /**
  * Extracts an array of values. Assumes the source data has already been
  * reduced as needed (e.g., by an upstream Aggregate transform), and that
  * the desired sorting has been performend (e.g., by a Collect transform).
  * @constructor
  * @param {object} params - The parameters for this operator.
  * @param {function(object): *} params.field - The domain field to extract.
  */
export default function Values(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(Values, Transform);

prototype.transform = function(_, pulse) {
  var run = !this.value
         || _.modified('field')
         || pulse.changed();

  if (run) {
    this.value = pulse.source.map(_.field);
  }
};
