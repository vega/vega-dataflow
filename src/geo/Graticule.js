import Transform from '../Transform';
import {inherits} from '../util/Functions';
import {isFunction} from '../util/Objects';

import {geoGraticule} from 'd3-geo';

/**
 * GeoJSON feature generator for creating graticules.
 * @constructor
 */
export default function Graticule(params) {
  Transform.call(this, [], params);
  this.generator = geoGraticule();
}

var prototype = inherits(Graticule, Transform);

prototype.transform = function(_, pulse) {
  var out = pulse.fork(),
      src = this.value,
      gen = this.generator;

  if (!src.length || _.modified()) {
    for (var prop in _) {
      if (isFunction(gen[prop])) {
        gen[prop](_[prop]);
      }
    }
  } else {
    out.rem.push(src[0]);
  }

  out.source = this.value = src = [gen()];
  out.add.push(src[0]);
  return out;
};
