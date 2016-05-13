import Transform from './Transform';
import {inherits} from '../util/Functions';
import {ingest, prev} from '../Tuple';

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

var prototype = inherits(Histogram, Transform);

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
        x = keys[k] || (add = 1, keys[k] = create(k));
    x.count += 1;
    if (add) out.add.push(x);
  });

  pulse.visit(pulse.REM, function(t) {
    var x = keys[key(t)];
    x.count -= 1;
  });

  pulse.visit(pulse.MOD, function(t) {
    var u = keys[key(prev(t))],
        v = keys[key(t)];
    u.count -= 1;
    v.count += 1;
  });

  // TODO: introduce proper mod tuple handling
  // this hack forces modification checks to work
  out.mod = [null];

  return out.modifies(['key', 'count']);
};
