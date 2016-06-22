import Transform from '../Transform';
import {inherits, Identity} from '../util/Functions';

import {geoPath} from 'd3-geo';

/**
 * Map GeoJSON data to an SVG path string.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(number, number): *} params.projection - The cartographic
 *   projection to apply.
 * @param {number} params.pointRadius - The point radius for path points.
 * @param {function(object): *} [params.field] - The field with GeoJSON data,
 *   or null if the tuple itself is a GeoJSON feature.
 * @param {string} [params.as='path'] - The output field in which to store
 *   the generated path data (default 'path').
 */
export default function GeoPath(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(GeoPath, Transform);

prototype.transform = function(_, pulse) {
  var path = this.value,
      field = _.field || Identity,
      as = _.as || 'path',
      mod;

  function set(t) {
    t[as] = path(field(t));
  }

  if (!path || _.modified()) {
    // parameters updated, reset and reflow
    this.value = path = geoPath()
      .pointRadius(_.pointRadius)
      .projection(_.projection);

    pulse.materialize().reflow().visit(pulse.SOURCE, set);
  } else {
    mod = field === Identity || pulse.modified(field.fields);
    pulse.visit(mod ? pulse.ADD_MOD : pulse.ADD, set);
  }

  return pulse.modifies(as);
};
