import Transform from './Transform';
import {idFilter} from '../Tuple';

// Collects all data tuples that pass through this operator.
export default function Collector() {
  Transform.call(this, []);
}

var prototype = (Collector.prototype = Object.create(Transform.prototype));
prototype.constructor = Collector;

prototype._transform = function(_, pulse) {
  var data = this.value;

  if (pulse.rem.length) {
    data = idFilter(data, pulse.rem);
  }

  if (pulse.add.length) {
    data = data.concat(pulse.add);
  }

  if (pulse.sort) {
    data.sort(pulse.sort);
  }

  this.value = data;
  pulse.collector = this;  // TODO: revisit
  return pulse;
};
