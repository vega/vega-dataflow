var tupleID = 0;

// Object.create is expensive. So, when ingesting, trust that the
// datum is an object that has been appropriately sandboxed from 
// the outside environment. 
function ingest(datum, prev) {
  datum = (datum === Object(datum)) ? datum : {data: datum};
  datum._id = ++tupleID;
  datum._prev = prev;//(prev === undefined) ? prev : (prev || SENTINEL);
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
    // TODO is it safe to use a raw previous object here?
    //return ingest(Object.create(d), p);
    var p = d._prev !== undefined ? d._prev : prev;
    return ingest(copy(d), p ? copy(p) : p);
  },

  rederive: function(d, t) {
    if (d._prev) copy(d._prev, t._prev);
    return copy(d, t);
  },

  // WARNING: operators should only call this once per timestamp!
  set: function(t, k, v) {
    var u = t[k], p;
    if (u === v) {
      return false;
    } else if ((p = t._prev) !== undefined) {
      if (p === null) { t._prev = (p = copy(t)); }
      p[k] = u;
    }

    t[k] = v;
    return true;
  },

  prev: function(t) {
    return t._prev || t;
  },

  init_prev: function(d) {
    if (d._prev === undefined) d._prev = null;
  },

  reset_prev: function(d) {
    var p = d._prev, k;
    for (k in p) p[k] = d[k];
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
