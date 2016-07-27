import {scaleOrdinal, scaleLinear, scaleSequential} from 'd3-scale';
import {range} from 'd3-array';

export default function index(scheme) {
  var ordinal = scaleOrdinal(),
      interpolate = scheme ? scaleSequential(scheme) : scaleLinear();

  function scale(_) {
    return interpolate(ordinal(_));
  }

  scale.ordinal = ordinal;
  scale.interp = interpolate;

  scale.domain = function(_) {
    if (!arguments.length) return ordinal.domain();
    ordinal.domain(_);
    ordinal.range(range(0, _.length));
    interpolate.domain([0, _.length-1]);
    return scale;
  };

  scale.invert = function(_) {
    return ordinal.domain()[~~interpolate.invert(_)];
  };

  (scheme ? ['clamp'] : ['clamp', 'range', 'rangeRound'])
    .forEach(function(method) {
      scale[method] = function() {
        var r = interpolate[method].apply(null, arguments);
        return arguments.length ? scale : r;
      };
    });

  scale.copy = function() {
    return (scheme ? index(scheme) : index().range(interpolate.range()))
      .domain(ordinal.domain())
      .clamp(interpolate.clamp());
  };

  return scale;
}
