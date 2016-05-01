import Transform from './Transform';

// Selectively filters tuples by resolving against filter bitmaps.
// Useful for processing the output of a cross-filter transform.
// The 'ignore' parameter is a bit mask indicating which filters to ignore.
// The 'bitmap' parameter references the per-tuple filter bitmaps.
export default function ResolveFilter(params) {
  Transform.call(this, null, params);
}

var prototype = (ResolveFilter.prototype = Object.create(Transform.prototype));
prototype.constructor = ResolveFilter;

prototype._transform = function(_, pulse) {
  var ignore = ~(_.ignore || 0), // bit mask where zeros -> dims to ignore
      bitmap = _.bitmap,
      mask = bitmap.mask;

  // exit early if no relevant filter changes
  if ((mask & ignore) === 0) return pulse.StopPropagation;

  var output = pulse.fork(pulse.ALL),
      curr = bitmap.curr(),
      prev = bitmap.prev(),
      pass = function(t) { return !(curr[t._index] & ignore); };

  // propagate all mod tuples that pass the filter
  output.filter(output.MOD, pass);

  // determine add & rem tuples via filter functions
  // for efficiency, we do *not* populate new arrays here
  // instead we add filter functions applied downstream

  if (!(mask & (mask-1))) { // only one filter changed

    output.filter(output.ADD, pass);

    output.filter(output.REM, function(t) {
      return (curr[t._index] & ignore) === mask;
    });

  } else { // multiple filters changed

    output.filter(output.ADD, function(t) {
      var k = t._index,
          c = curr[k] & ignore;
      return !c // does the tuple pass all filters?
          && (c ^ (prev[k] & ignore)); // did the state change?
    });

    output.filter(output.REM, function(t) {
      var k = t._index,
          c = curr[k] & ignore;
      return c // does at least one filter block the tuple?
          && !(c ^ (c ^ (prev[k] & ignore))); // did the state change?
    });
  }

  return output;
};
