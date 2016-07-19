import Transform from '../Transform';
import {error, inherits, isFunction} from 'vega-util';
import getProjection from './projections';

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
  var proj = this.value, prop;

  if (!proj || _.modified('type')) {
    this.value = (proj = createProjection(_.type));
  }

  for (prop in _) {
    if (isFunction(proj[prop])) {
      proj[prop](_[prop]);
    }
  }
};

function createProjection(projType) {
  var type = (projType || 'mercator').toLowerCase(),
      proj;

  if (!type || !(proj = getProjection(type))) {
    error('Unrecognized projection type: ' + projType);
  }

  return proj = proj(), proj.type = type, proj;
}
