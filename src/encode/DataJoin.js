import Transform from '../Transform';
import {id, ingest} from '../Tuple';
import {error, inherits} from 'vega-util';
import {map} from 'd3-collection';

/**
 * Joins a set of data elements against a set of visual items.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): object} [params.item] - An item generator function.
 * @param {function(object): *} [params.key] - The key field associating data and visual items.
 */
export default function DataJoin(params) {
  Transform.call(this, map(), params);
}

var prototype = inherits(DataJoin, Transform);

function defaultItemCreate() {
  return ingest({});
}

prototype.transform = function(_, pulse) {
  var out = pulse.fork(pulse.NO_SOURCE),
      item = _.item || defaultItemCreate,
      key = _.key || id,
      lut = this.value;

  if (_.modified('key') || pulse.modified(key)) {
    // TODO: support re-keying?
    error('DataJoin does not support modified key function or fields.');
  }

  pulse.visit(pulse.ADD, function(t) {
    var k = key(t),
        x = lut.get(k);

    if (x) {
      out.mod.push(x);
    } else {
      lut.set(k, x = item(t));
      out.add.push(x);
    }

    x.datum = t;
  });

  pulse.visit(pulse.MOD, function(t) {
    var k = key(t),
        x = lut.get(k);

    if (x) {
      out.mod.push(x);
    }
  });

  pulse.visit(pulse.REM, function(t) {
    var k = key(t),
        x = lut.get(k);

    if (t === x.datum) {
      lut.remove(k);
      out.rem.push(x);
    }
  });

  return out;
};
