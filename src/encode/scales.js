import * as $ from 'd3-scale';
import * as _ from 'd3-scale-chromatic';

function categorical(scheme) {
  return function() { return $.scaleOrdinal(scheme); };
}

function interpolate(interp) {
  return function() { return $.scaleSequential(interp); };
}

export default {
  // base scale types
  band:        $.scaleBand,
  point:       $.scalePoint,
  identity:    $.scaleIdentity,
  linear:      $.scaleLinear,
  log:         $.scaleLog,
  ordinal:     $.scaleOrdinal,
  pow:         $.scalePow,
  sqrt:        $.scaleSqrt,
  quantile:    $.scaleQuantile,
  quantize:    $.scaleQuantize,
  threshold:   $.scaleThreshold,
  time:        $.scaleTime,
  utc:         $.scaleUtc,

  // d3 categorical
  category10:  categorical($.schemeCategory10),
  category20:  categorical($.schemeCategory20),
  category20b: categorical($.schemeCategory20b),
  category20c: categorical($.schemeCategory20c),

  // d3 sequential
  cubehelix:   interpolate($.interpolateCubehelixDefault),
  rainbow:     interpolate($.interpolateRainbow),
  warm:        interpolate($.interpolateWarm),
  cool:        interpolate($.interpolateCool),
  viridis:     interpolate($.interpolateViridis),
  magma:       interpolate($.interpolateMagma),
  inferno:     interpolate($.interpolateInferno),
  plasma:      interpolate($.interpolatePlasma),

  // categorical
  accent:      categorical(_.schemeAccent),
  dark2:       categorical(_.schemeDark2),
  paired:      categorical(_.schemePaired),
  pastel1:     categorical(_.schemePastel1),
  pastel2:     categorical(_.schemePastel2),
  set1:        categorical(_.schemeSet1),
  set2:        categorical(_.schemeSet2),
  set3:        categorical(_.schemeSet3),

  // diverging
  brbg:        interpolate(_.interpolateBrBG),
  prgn:        interpolate(_.interpolatePRGn),
  piyg:        interpolate(_.interpolatePiYG),
  puor:        interpolate(_.interpolatePuOr),
  rdbu:        interpolate(_.interpolateRdBu),
  rdgy:        interpolate(_.interpolateRdGy),
  rdylbu:      interpolate(_.interpolateRdYlBu),
  rdylgn:      interpolate(_.interpolateRdYlGn),
  spectral:    interpolate(_.interpolateSpectral),

  // sequential multi-hue
  bugn:        interpolate(_.interpolateBuGn),
  bupu:        interpolate(_.interpolateBuPu),
  gnbu:        interpolate(_.interpolateGnBu),
  orrd:        interpolate(_.interpolateOrRd),
  pubugn:      interpolate(_.interpolatePuBuGn),
  pubu:        interpolate(_.interpolatePuBu),
  purd:        interpolate(_.interpolatePuRd),
  rdpu:        interpolate(_.interpolateRdPu),
  ylgnbu:      interpolate(_.interpolateYlGnBu),
  ylgn:        interpolate(_.interpolateYlGn),
  ylorbr:      interpolate(_.interpolateYlOrBr),
  ylorrd:      interpolate(_.interpolateYlOrRd),

  // sequential single-hue
  blues:       interpolate(_.interpolateBlues),
  greens:      interpolate(_.interpolateGreens),
  greys:       interpolate(_.interpolateGreys),
  purples:     interpolate(_.interpolatePurples),
  reds:        interpolate(_.interpolateReds),
  oranges:     interpolate(_.interpolateOranges)
};
