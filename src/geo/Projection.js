import Transform from '../Transform';
import {error} from '../util/Errors';
import {inherits, isFunction} from 'vega-util';
import {projections} from './projections';

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
      proj = projections[type];

  if (!type || !projections.hasOwnProperty(type)) {
    error('Unrecognized projection type: ' + projType);
  }

  return proj = proj(), proj.type = type, proj;
}
