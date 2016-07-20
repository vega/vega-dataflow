import Transform from '../Transform';
import {error, inherits} from 'vega-util';
import {default as projection, properties} from './projections';

/**
 * Maintains a cartographic projection.
 * @constructor
 * @param {object} params - The parameters for this operator.
 */
export default function Projection(params) {
  Transform.call(this, null, params);
  this.modified(true); // always treat as modified
}

var prototype = inherits(Projection, Transform);

prototype.transform = function(_) {
  var proj = this.value;

  if (!proj || _.modified('type')) {
    this.value = (proj = createProjection(_.type));
    properties.forEach(function(prop) {
      if (_[prop] != null) proj[prop](_[prop]);
    });
  } else {
    properties.forEach(function(prop) {
      if (_.modified(prop)) proj[prop](_[prop]);
    });
  }
};

function createProjection(projType) {
  var type = (projType || 'mercator').toLowerCase(),
      proj;

  if (!type || !(proj = projection(type))) {
    error('Unrecognized projection type: ' + projType);
  }

  return proj = proj(), proj.type = type, copy(proj);
}

// Augment projections with a copy method, akin to scales
function copy(p) {
  p.copy = p.copy || function() {
    var c = createProjection(p.type);
    properties.forEach(function(prop) {
      if (p.hasOwnProperty(prop)) {
        c[prop](p[prop]());
      }
    });
    return c;
  };
  return p;
}
