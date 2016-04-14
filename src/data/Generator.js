import Transform from './Transform';
import {ingest} from '../Tuple';

// Generates data tuples using a provided generator function.
// The 'gen' parameter provides the tuple-generating function.
// The 'num' parameter indicates the number of tuples to produce.
export default function Generator(args) {
  Transform.call(this, [], args);
}

var prototype = (Generator.prototype = Object.create(Transform.prototype));
prototype.constructor = Generator;

prototype._transform = function(_, pulse) {
  var data = this.value,
      num = _.num - data.length,
      gen = _.gen,
      datum;

  if (num > 0) {
    while (--num >= 0) {
      datum = ingest(gen(_));
      pulse.add.push(datum);
      data.push(datum);
    }
  } else {
    pulse.rem = pulse.rem.concat(data.slice(0, -num));
    data = data.slice(-num);
  }

  this.value = data;
  pulse.collector = this; // TODO: revisit
  return pulse;
};
