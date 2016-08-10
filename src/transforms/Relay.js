import Transform from '../Transform';
import {derive, rederive} from '../Tuple';
import {inherits} from 'vega-util';

/**
 * Relays a data stream by creating derived copies of observed tuples.
 * This operator is useful for creating derived data streams in which
 * modifications to the tuples do not pollute an upstream data source.
 * @constructor
 */
export default function Relay(params) {
  Transform.call(this, {}, params);
}

var prototype = inherits(Relay, Transform);

prototype.transform = function(_, pulse) {
  var stamp = pulse.stamp,
      out = pulse.fork(),
      lut = this.value;

  pulse.visit(pulse.ADD, function(t) {
    var dt = derive(t);
    lut[t._id] = dt;
    out.add.push(dt);
  });

  pulse.visit(pulse.MOD, function(t) {
    out.mod.push(rederive(t, lut[t._id], stamp));
  });

  pulse.visit(pulse.REM, function(t) {
    out.rem.push(lut[t._id]);
    delete lut[t._id];
  });

  return out;
};
