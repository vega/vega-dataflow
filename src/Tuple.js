var SENTINEL = require('./Sentinel'),
    tupleID = 0;

// Object.create is expensive. So, when ingesting, trust that the
// datum is an object that has been appropriately sandboxed from 
// the outside environment. 
function ingest(datum, prev) {
  datum = (datum === Object(datum)) ? datum : {data: datum};
  datum._id = ++tupleID;
  datum._prev = (prev !== undefined) ? (prev || SENTINEL) : undefined;
  return datum;
}

function derive(datum, prev) {
  return ingest(Object.create(datum), prev);
}

// WARNING: operators should only call this once per timestamp!
function set(t, k, v) {
  var prev = t[k];
  if (prev === v) return false;

  var p = t._prev;
  if (p !== undefined) {
    if (p === SENTINEL) { t._prev = (p = Object.create(t)); }
    p[k] = prev;
  }

  t[k] = v;
  return true;
}

function prev(t) {
  var p = t._prev;
  return p !== SENTINEL && p || t;
}

function reset() {
  tupleID = 0;
}

function idMap(a, ids) {
  ids = ids || {};
  for (var i=0, n=a.length; i<n; ++i) {
    ids[a[i]._id] = 1;
  }
  return ids;
}

function idFilter(data) {
  var ids = {};
  for (var i=arguments.length; --i>0;) {
    idMap(arguments[i], ids);
  }
  return data.filter(function(x) { return !ids[x._id]; });
}

module.exports = {
  ingest:   ingest,
  derive:   derive,
  set:      set,
  prev:     prev,
  reset:    reset,
  idMap:    idMap,
  idFilter: idFilter
};
