import Transform from '../data/Transform';
import {inherits, False} from '../util/Functions';

/**
 * Invokes encoding functions for visual items.
 * @constructor
 * @param {object} encode - The encoding functions
 * @param {function(object, object): boolean} [encode.update] - Update encoding set
 * @param {function(object, object): boolean} [encode.enter] - Enter encoding set
 * @param {function(object, object): boolean} [encode.exit] - Exit encoding set
 * @param {object} params - The parameters to the encoding functions. This
 *   parameter object will be passed through to all invoked encoding functions.
 */
export default function Encode(encode, params) {
  Transform.call(this, encode, params);
}

var prototype = inherits(Encode, Transform);

prototype.transform = function(_, pulse) {
  var out = pulse.fork(pulse.ADD | pulse.REM),
      encode = this.value,
      update = encode.update || False,
      enter = encode.enter || False,
      exit = encode.exit || False,
      set = (pulse.encode ? encode[pulse.encode] : update) || False;

  if (enter !== False || update !== False) {
    pulse.visit(pulse.ADD, function(t) {
      enter(t, _);
      update(t, _);
      if (set !== False && set !== update) set(t, _);
    });
  }

  if (exit !== False) {
    pulse.visit(pulse.REM, function(t) {
      exit(t, _);
    });
  }

  if (set !== False) {
    var flag = pulse.MOD | (_.modified() ? pulse.REFLOW : 0);
    pulse.visit(flag, function(t) {
      if (set(t, _)) { out.mod.push(t); }
    });
  }

  return out;
};
