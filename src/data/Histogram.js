import Transform from './Transform';
import {ingest, set, prev} from '../Tuple';

// This operator populates a space of bins with occurrence counts
// Once created a bin it is never removed, though it can decrease to 0.
// This class should later be replaced by a full-featured aggregate.
// The 'field' parameter is an accessor that provides bin values.
export default function Histogram(args) {
  Transform.call(this, [], args);
  this._bins = {};
}

var prototype = (Histogram.prototype = Object.create(Transform.prototype));
prototype.constructor = Histogram;

function create(b) {
  return ingest({bin:b, count:0});
}

prototype._transform = function(_, pulse) {
  var bin = _.field,
      bins = this._bins,
      output = pulse.fork();

  function addF(t) {
    var b = bin(t),
        a = !bins[b],
        x = bins[b] || (bins[b] = create(b)),
        c = x.count + 1;
    set(x, 'count', c);
    if (a) output.add.push(x);
  }

  function remF(t) {
    var x = bins[bin(t)],
        c = x.count - 1;
    set(x, 'count', c);
    // if (c === 0) output.rem.push(x);
  }

  function modF(t) {
    var u = bins[bin(prev(t))],
        v = bins[bin(t)];
    set(u, 'count', u.count-1);
    set(v, 'count', v.count+1);
  }

  pulse.add.forEach(addF);
  pulse.rem.forEach(remF);
  pulse.mod.forEach(modF);

  return output.modifies(['bin', 'count']);
};
