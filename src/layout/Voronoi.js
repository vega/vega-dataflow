import Transform from '../Transform';
import {inherits} from '../util/Functions';

import {voronoi} from 'd3-voronoi';

export default function Voronoi(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(Voronoi, Transform);

var PARAMS = ['x', 'y', 'size', 'extent'];

prototype.transform = function(_, pulse) {
  var data = pulse.source,
      diagram, polygons, key, i, n;

  // configure and construct voronoi diagram
  diagram = voronoi();
  for (i=0, n=PARAMS.length; i<n; ++i) {
    key = PARAMS[i];
    if (key in _) diagram[key](_[key]);
  }
  this.value = (diagram = diagram(data));

  // map polygons to paths
  polygons = diagram.polygons();
  for (i=0, n=data.length; i<n; ++i) {
    data[i].path = polygons[i]
      ? 'M' + polygons[i].join('L') + 'Z'
      : null;
  }

  return pulse.reflow().modifies('path');
};
