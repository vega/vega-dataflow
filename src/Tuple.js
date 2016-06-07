var TUPLE_ID = 1;

/**
 * Resets the internal tuple id counter to zero.
 */
function reset() {
  TUPLE_ID = 1;
}

/**
 * Returns the id of a tuple.
 * @param {Tuple} t - The input tuple.
 * @return the tuple id.
 */
function id(t) {
  return t._id;
}

/**
 * Copy the values of one tuple to another (ignoring id and prev fields).
 * @param {Tuple} t - The tuple to copy from.
 * @param {Tuple} c - The tuple to write to.
 * @return The re-written tuple, same as the argument 'c'.
 */
function copy(t, c) {
  for (var k in t) {
    if (k !== '_prev' && k !== '_id') c[k] = t[k];
  }
  return c;
}

/**
 * Ingest an object or value as a data tuple.
 * If the input value is an object, an id field will be added to it. For
 * efficiency, the input object is modified directly. A copy is not made.
 * If the input value is a literal, it will be wrapped in a new object
 * instance, with the value accessible as the 'data' property.
 * @param datum - The value to ingest.
 * @return {Tuple} The ingested data tuple.
 */
function ingest(datum) {
  var tuple = (datum === Object(datum)) ? datum : {data: datum};
  if (!tuple._id) tuple._id = ++TUPLE_ID;
  if (tuple._prev) tuple._prev = null;
  return tuple;
}

/**
 * Given a source tuple, return a derived copy.
 * @param {object} t - The source tuple.
 * @return {object} The derived tuple.
 */
function derive(t) {
  return ingest(copy(t, {}));
}

/**
 * Rederive a derived tuple by copying values from the source tuple.
 * @param {object} t - The source tuple.
 * @param {object} d - The derived tuple.
 * @param {object} stamp - The current pulse timestamp.
 * @return {object} The derived tuple.
 */
function rederive(t, d, stamp) {
  copy(t, d);
  var p = t._prev;
  if (p && p._stamp >= stamp) prev_init(d, stamp);
  return d;
}

/**
 * Set a field value on a tuple.
 * @param {object} t - The tuple.
 * @param {object} k - The name of the field (property) to set.
 * @param {object} v - The value to set.
 * @return {number} Returns 1 if the tuple value was changed, 0 otherwise.
 */
function set(t, k, v) {
  return t[k] === v ? 0 : (t[k] = v, 1);
}

/**
 * Returns the previous value of a tuple. If no previous value exists for
 * the provided timestamp, the input tuple is returned directly.
 * @param {object} t - The tuple.
 * @param {object} stamp - The minimum timestamp of the previous value.
 * @return {object} The previous value of the tuple.
 */
function prev(t, stamp) {
  var p = t._prev;
  return (p && p._stamp >= stamp) ? p : t;
}

/**
 * Initializes the previous value of a tuple for the specified timestamp.
 * The current values of the input tuple are copied to a previous tuple
 * instance, which can be accessed using the {@link prev} method.
 * @param {object} t - The tuple.
 * @param {object} stamp - The current pulse timestamp.
 */
function prev_init(t, stamp) {
  var p = t._prev, k, v;
  if (!p) { p = t._prev = {_id: t._id, _stamp: stamp}; }
  else if (p._stamp === stamp) return;
  else p._stamp = stamp;

  for (k in t) {
    if (k !== '_prev' && k !== '_id') {
      p[k] = ((v=t[k]) instanceof Object && v._prev) ? v._prev : v;
    }
  }
}

// TODO: refactor this method to utilities?
/**
 * Builds a boolean indicator map of tuple ids. For each tuple id,
 * an entry in the map is set to one.
 * @param {Array<object>} a - An array of tuples.
 * @param {object} [ids] - The map to modify.
 * @return {object} The constructed id map.
 */
function idMap(a, ids) {
  ids = ids || {};
  for (var i=0, n=a.length; i<n; ++i) {
    ids[a[i]._id] = 1;
  }
  return ids;
}

// TODO: refactor this method to utilities?
/**
 * Filters an array of data tuples, by first building a map of tuple ids
 * for each of the var_args arrays provided.
 * @param {Array<object>} data - An array of tuples.
 * @param {...Array<object>} var_args - Arrays containing the tuples to remove.
 * @return {Array<object>} The filtered data array.
 */
function idFilter(data) {
  var ids = {};
  for (var i=arguments.length; --i>0;) {
    idMap(arguments[i], ids);
  }
  return data.filter(function(x) { return !ids[x._id]; });
}

export {
  reset, id,
  ingest, derive, rederive, set,
  prev, prev_init,
  idMap, idFilter
};
