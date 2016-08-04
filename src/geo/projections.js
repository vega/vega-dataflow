import {
  geoAlbers,
  geoAlbersUsa,
  geoAzimuthalEqualArea,
  geoAzimuthalEquidistant,
  geoConicConformal,
  geoConicEqualArea,
  geoConicEquidistant,
  geoEquirectangular,
  geoGnomonic,
  geoMercator,
  geoOrthographic,
  geoStereographic,
  geoTransverseMercator
} from 'd3-geo';

var projections = {
  // base d3-geo projection types
  albers:               geoAlbers,
  albersusa:            geoAlbersUsa,
  azimuthalequalarea:   geoAzimuthalEqualArea,
  azimuthalequidistant: geoAzimuthalEquidistant,
  conicconformal:       geoConicConformal,
  conicequalarea:       geoConicEqualArea,
  conicequidistant:     geoConicEquidistant,
  equirectangular:      geoEquirectangular,
  gnomonic:             geoGnomonic,
  mercator:             geoMercator,
  orthographic:         geoOrthographic,
  stereographic:        geoStereographic,
  transversemercator:   geoTransverseMercator
};

// TODO check for other properties in d3-geo-projections
export var properties = [
  'clipAngle',
  'clipExtent',
  'scale',
  'translate',
  'center',
  'rotate',
  'precision'
];

export default function(name, proj) {
  return arguments.length > 1 ? (projections[name] = proj, this)
    : projections.hasOwnProperty(name) ? projections[name] : null;
}
