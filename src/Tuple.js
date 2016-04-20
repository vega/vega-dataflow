var TUPLE_ID = 0;

function reset() {
  TUPLE_ID = 0;
}

function copy(t, c) {
  c = c || {};
  for (var k in t) {
    if (k !== '_prev' && k !== '_id') c[k] = t[k];
  }
  return c;
}

function ingest(datum) {
  datum = (datum === Object(datum)) ? datum : {data: datum};
  datum._id = ++TUPLE_ID;
  if (datum._prev) datum._prev = null;
  return datum;
}

function derive(d) {
  return ingest(copy(d));
}

function rederive(d, t) {
  return copy(d, t);
}

function set(t, k, v) {
  return t[k] === v ? 0 : (t[k] = v, 1);
}

function prev(t) {
  return t._prev || t;
}

function prev_init(t) {
  if (!t._prev) { t._prev = {_id: t._id}; }
}

function prev_update(t) {
  var p = t._prev, k, v;
  if (p) for (k in t) {
    if (k !== '_prev' && k !== '_id') {
      p[k] = ((v=t[k]) instanceof Object && v._prev) ? v._prev : v;
    }
  }
}

// TODO: refactor this method to utilities?
function idMap(a, ids) {
  ids = ids || {};
  for (var i=0, n=a.length; i<n; ++i) {
    ids[a[i]._id] = 1;
  }
  return ids;
}

// TODO: refactor this method to utilities?
function idFilter(data) {
  var ids = {};
  for (var i=arguments.length; --i>0;) {
    idMap(arguments[i], ids);
  }
  return data.filter(function(x) { return !ids[x._id]; });
}

export {
  reset,
  ingest, derive, rederive, set,
  prev, prev_init, prev_update,
  idMap, idFilter
};