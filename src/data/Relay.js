import Transform from './Transform';
import {derive, rederive} from '../Tuple';

/**
 * Relays a data stream by creating derived copies of observed tuples.
 * This operator is useful for creating derived data streams in which
 * modifications to the tuples do not pollute an upstream data source.
 * @constructor
 */
export default function Relay() {
  Transform.call(this, {});
}

var prototype = (Relay.prototype = Object.create(Transform.prototype));
prototype.constructor = Relay;

prototype.transform = function(_, pulse) {
  var stamp = pulse.stamp,
      out = pulse.fork(),
      map = this.value;

  pulse.visit(pulse.ADD, function(t) {
    out.add.push(map[t._id] = derive(t));
  });

  pulse.visit(pulse.MOD, function(t) {
    out.mod.push(rederive(t, map[t._id], stamp));
  });

  pulse.visit(pulse.REM, function(t) {
    out.rem.push(map[t._id]);
    map[t._id] = null;
  });

  return out;
};
