import Transform from './Transform';
import {ingest} from '../Tuple';
import {range} from '../util/Arrays';

// Generates data tuples using a provided generator function.
// The 'gen' parameter provides the tuple-generating function.
// The 'num' parameter indicates the number of tuples to produce.
export default function GenerateRange(params) {
  Transform.call(this, [], params);
}

var prototype = (GenerateRange.prototype = Object.create(Transform.prototype));
prototype.constructor = GenerateRange;

prototype._transform = function(_, pulse) {
  if (_.modified()) {
    pulse.materialize();
    var output = pulse.fork(pulse.MOD);
    output.rem = pulse.rem.concat(this.value);
    this.value = range(_.start, _.stop, _.step).map(ingest);
    output.add = pulse.add.concat(this.value);
    return output;
  }
};
