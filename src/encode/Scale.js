import Transform from '../data/Transform';
import {inherits} from '../util/Functions';
import {error} from '../util/Errors';

import * as d3_scale from 'd3-scale';

var TYPE = 'type';

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
      prop;

  if (!scale || _.modified(TYPE)) {
    this.value = (scale = createScale(_[TYPE]));
  }

  for (prop in _) {
    if (scale.hasOwnProperty(prop) && typeof scale[prop] === 'function') {
      scale[prop](_[prop]);
    }
  }
};

function createScale(scaleType) {
  var type = (scaleType || 'linear').toLowerCase(),
      method = 'scale' + type[0].toUpperCase() + type.slice(1);

  if (!method) {
    error('Unrecognized scale type: ' + type);
  }

  var scale = d3_scale[method]();
  // TODO: ensure appropriate invert method?
  scale[TYPE] = type;
  return scale;
}

/*
// "Polyfill" ordinal scale inversion. Currently, only ordinal scales
// with ordered numeric ranges are supported.
var bisect = d3.bisector(dl.numcmp).right,
    findAsc = function(a, x) { return bisect(a,x) - 1; },
    findDsc = d3.bisector(function(a,b) { return -1 * dl.numcmp(a,b); }).left;

function invertOrdinal(x, y) {
  var rng = this.range(),
      asc = rng[0] < rng[1],
      find = asc ? findAsc : findDsc;

  if (arguments.length === 1) {
    if (!dl.isNumber(x)) {
      throw Error('Ordinal scale inversion is only supported for numeric input ('+x+').');
    }
    return this.domain()[find(rng, x)];

  } else if (arguments.length === 2) {  // Invert extents
    if (!dl.isNumber(x) || !dl.isNumber(y)) {
      throw Error('Extents to ordinal invert are not numbers ('+x+', '+y+').');
    }

    var domain = this.domain(),
        a = find(rng, x),
        b = find(rng, y),
        n = rng.length - 1, r;
    if (b < a) { r = a; a = b; b = a; } // ensure a <= b
    if (a < 0) a = 0;
    if (b > n) b = n;

    return (asc ? dl.range(a, b+1) : dl.range(b, a-1, -1))
      .map(function(i) { return domain[i]; });
  }
}
*/