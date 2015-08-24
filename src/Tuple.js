var tupleID = 0;

// Object.create is expensive. So, when ingesting, trust that the
// datum is an object that has been appropriately sandboxed from 
// the outside environment. 
function ingest(datum) {
  datum = (datum === Object(datum)) ? datum : {data: datum};
  return (datum._id = ++tupleID, datum);
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
    if (d._prev) copy(d._prev, t._prev);
    return copy(d, t);
  },

  set: function(t, k, v) {
    return t[k] === v ? false : (t[k] = v, true);
  },

  prev: function(t, stamp) {
    var p = t._prev || (t._prev = {_id: t._id});
    // TODO update copy to handle tuple values with their own _prev.
    return (!stamp || p._stamp === stamp) ? p : (p._stamp = stamp, copy(t, p));
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
