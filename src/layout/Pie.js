import Transform from '../data/Transform';
import {inherits, One} from '../util/Functions';
import {range} from '../util/Arrays';
import {sum} from '../util/Stats';

/**
 * Pie and donut chart layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to size pie segments.
 * @param {number} [params.startAngle=0] - The start angle (in radians) of the layout.
 * @param {number} [params.endAngle=2π] - The end angle (in radians) of the layout.
 * @param {boolean} [params.sort] - Boolean flag for sorting sectors by value.
 */
export default function Pie(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(Pie, Transform);

prototype.transform = function(_, pulse) {
  var field = _.field || One,
      start = _.startAngle || 0,
      stop = _.endAngle != null ? _.endAngle : 2*Math.PI,
      data = pulse.source,
      values = data.map(field),
      n = values.length,
      a = start,
      k = (stop - start) / sum(values),
      index = range(n),
      i, t, v;

  if (_.sort) {
    index.sort(function(a, b) {
      return values[a] - values[b];
    });
  }

  for (i=0; i<n; ++i) {
    v = values[index[i]];
    t = data[index[i]];
    t.layout_start = a;
    t.layout_mid = a + 0.5 * v * k;
    t.layout_end = (a += v * k);
  }

  this.value = values;
  return pulse.reflow().modifies(['layout_start', 'layout_end', 'layout_mid']);
};
