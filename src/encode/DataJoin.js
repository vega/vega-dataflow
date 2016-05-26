import Transform from '../data/Transform';
import {inherits} from '../util/Functions';
import {error} from '../util/Errors';
import {id} from '../Tuple';

/**
 * Joins a set of data elements against a set of visual items.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): object} params.item - An item generator function.
 * @param {function(object): *} [params.key] - The key field associating data and visual items.
 */
export default function DataJoin(params) {
  Transform.call(this, {}, params);
}

var prototype = inherits(DataJoin, Transform);

prototype.transform = function(_, pulse) {
  var out = pulse.fork(pulse.NO_SOURCE),
      map = this.value,
      key = _.key || id,
      item = _.item;

  if (_.modified('key') || pulse.modified(key)) {
    // TODO: support re-keying?
    error('DataJoin does not support modified key function or fields.');
  }

  pulse.visit(pulse.REM, function(t) {
    var k = key(t),
        x = map[k];

    if (x) {
      map[k] = null; // TODO: condense map on occasion?
      out.rem.push(x);
    }
  });

  pulse.visit(pulse.ADD, function(t) {
    var k = key(t),
        x = map[k];

    if (x) {
      out.mod.push(x);
    } else {
      map[k] = (x = item(t));
      out.add.push(x);
    }
    x.datum = t;
  });

  pulse.visit(pulse.MOD, function(t) {
    var k = key(t),
        x = map[k];

    if (x) {
      out.mod.push(x);
    }
  });

  return out;
};
