import Transform from './Transform';
import {ingest, set, prev} from '../Tuple';

/**
 * Counts occurrences of a set of key values.
 * Once created a key is never removed, though it can decrease to 0.
 * This class should later be replaced by a full-featured aggregator.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - An accessor for key values.
 */
export default function Histogram(params) {
  Transform.call(this, [], params);
  this._keys = {};
}

var prototype = (Histogram.prototype = Object.create(Transform.prototype));
prototype.constructor = Histogram;

function create(k) {
  return ingest({key:k, count:0});
}

prototype.transform = function(_, pulse) {
  var keys = this._keys,
      key = _.field,
      out = pulse.fork();

  pulse.visit(pulse.ADD, function(t) {
    var add = 0,
        k = key(t),
        x = keys[k] || (add = 1, keys[k] = create(k)),
        c = x.count + 1;
    set(x, 'count', c);
    if (add) out.add.push(x);
  });

  pulse.visit(pulse.REM, function(t) {
    var x = keys[key(t)],
        c = x.count - 1;
    set(x, 'count', c);
  });

  pulse.visit(pulse.MOD, function(t) {
    var u = keys[key(prev(t))],
        v = keys[key(t)];
    set(u, 'count', u.count-1);
    set(v, 'count', v.count+1);
  });

  return out.modifies(['key', 'count']);
};
