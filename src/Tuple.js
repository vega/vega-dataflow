var tupleID = 0;

// Object.create is expensive. So, when ingesting, trust that the
// datum is an object that has been appropriately sandboxed from 
// the outside environment. 
function ingest(datum) {
  datum = (datum === Object(datum)) ? datum : {data: datum};
  var id = ++tupleID;
  datum._id = id;
  if (datum._prev) datum._prev._id = id;
  return datum;
}

function idMap(a, ids) {
  ids = ids || {};
  for (var i=0, n=a.length; i<n; ++i) {
    ids[a[i]._id] = 1;
  }
  return ids;
}

function copy(t, c) {
  c = c || {};
  for (var k in t) {
    if (k !== '_prev' && k !== '_id') c[k] = t[k];
  }
  return c;
}

module.exports = {
  ingest: ingest,
  idMap: idMap,

  derive: function(d) {
    return ingest(copy(d));
  },

  rederive: function(d, t) {
    return copy(d, t);
  },

  set: function(t, k, v) {
    return t[k] === v ? 0 : (t[k] = v, 1);
  },

  prev: function(t) {
    return t._prev || t;
  },

  prev_init: function(t) {
    if (!t._prev) { t._prev = {_id: t._id}; }
  },

  prev_update: function(t) {
    // TODO update copy to handle tuple values with their own _prev.
    if (t._prev) { copy(t, t._prev); }
  },

  reset: function() { tupleID = 0; },

  idFilter: function(data) {
    var ids = {};
    for (var i=arguments.length; --i>0;) {
      idMap(arguments[i], ids);
    }
    return data.filter(function(x) { return !ids[x._id]; });
  }
};
