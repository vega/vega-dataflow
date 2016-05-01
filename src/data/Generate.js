import Transform from './Transform';
import {ingest} from '../Tuple';

// Generates data tuples using a provided generator function.
// The 'gen' parameter provides a tuple-generating function.
// The 'num' parameter indicates the number of tuples to produce.
// Any other parameters are passed along to the generator function.
// Changes to additional parameters will not trigger re-calculation
// of previously generated tuples. Only future tuples are affected.
export default function Generate(params) {
  Transform.call(this, [], params);
}

var prototype = (Generate.prototype = Object.create(Transform.prototype));
prototype.constructor = Generate;

prototype._transform = function(_, pulse) {
  var data = this.value,
      out = pulse.fork(pulse.ALL),
      num = _.num - data.length,
      gen = _.gen,
      add, rem, t;

  if (num > 0) {
    // need more tuples, generate and add
    for (add=[]; --num >= 0;) {
      add.push(t = ingest(gen(_)));
      data.push(t);
    }
    out.add = out.add.length
      ? out.materialize(out.ADD).add.concat(add)
      : add;
  } else {
    // need fewer tuples, remove
    rem = data.slice(0, -num);
    out.rem = out.rem.length
      ? out.materialize(out.REM).rem.concat(rem)
      : rem;
    data = data.slice(-num);
  }

  this.value = data;
  return out;
};
