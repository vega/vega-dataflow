var tupleID = 0;

// Object.create is expensive. So, when ingesting, trust that the
// datum is an object that has been appropriately sandboxed from 
// the outside environment. 
function ingest(datum, prev) {
  datum = (datum === Object(datum)) ? datum : {data: datum};
  datum._id = ++tupleID;
  datum._prev = prev;
  if (prev) prev._id = datum._id;
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

  derive: function(d, prev) {
    var p = d._prev !== undefined ? d._prev : (prev ? null : undefined);
    return ingest(copy(d), p ? copy(p) : p);
  },

  rederive: function(d, t) {
    if (d._prev) copy(d._prev, t._prev);
    return copy(d, t);
  },

  // WARNING: operators should only call this once per timestamp!
  set: function(t, k, v) {
    var u = t[k];
        p = t._prev;

    if (p !== undefined) {
      if (p === null) {
        t._prev = (p = copy(t));
        p._id = t._id;
      }
      p[k] = u;
    }

    return u === v ? false : (t[k] = v, true);
  },

  prev: function(t) {
    return t._prev || t;
  },

  init_prev: function(t) {
    if (t._prev === undefined) t._prev = null;
  },

  reset_prev: function(t) {
    var p = t._prev, k;
    for (k in p) p[k] = t[k];
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
