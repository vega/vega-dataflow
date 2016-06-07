import Transform from '../Transform';
import {inherits} from '../util/Functions';
import {isFunction} from '../util/Objects';
import {error} from '../util/Errors';

import {default as scales} from './scales';

var TYPE = 'type',
    NICE = 'nice';

/**
 * Maintains a scale function mapping data values to visual channels.
 * @constructor
 * @param {object} params - The parameters for this operator.
 */
export default function Scale(params) {
  Transform.call(this, null, params);
  this.modified(true); // always treat as modified
}

var prototype = inherits(Scale, Transform);

prototype.transform = function(_) {
  var scale = this.value,
      prop, nice;

  if (!scale || _.modified(TYPE)) {
    this.value = (scale = createScale(_[TYPE]));
  }

  for (prop in _) {
    if (prop === NICE) {
      nice = _[prop];
    } else if (isFunction(scale[prop])) {
      scale[prop](_[prop]);
    }
  }

  if (nice && scale.nice) {
    scale.nice((nice !== true && +nice) || null);
  }
};

function createScale(scaleType) {
  var type = (scaleType || 'linear').toLowerCase();

  if (!type || !scales.hasOwnProperty(type)) {
    error('Unrecognized scale type: ' + scaleType);
  }

  var scale = scales[type]();
  return scale[TYPE] = type, scale;
}
