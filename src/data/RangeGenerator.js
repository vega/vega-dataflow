import Transform from './Transform';
import {ingest} from '../Tuple';
import {range} from '../util/Arrays';

// Generates data tuples using a provided generator function.
// The 'gen' parameter provides the tuple-generating function.
// The 'num' parameter indicates the number of tuples to produce.
export default function RangeGenerator(args) {
  Transform.call(this, [], args);
}

var prototype = (RangeGenerator.prototype = Object.create(Transform.prototype));
prototype.constructor = RangeGenerator;

prototype._transform = function(_, pulse) {
  if (_.modified()) {
    pulse.rem = pulse.rem.concat(this.value);
    this.value = range(_.start, _.stop, _.step).map(ingest);
    pulse.add = pulse.add.concat(this.value);
  }
  return pulse;
};
