// Maintains a list of values, sorted by key
export default function SortedIndex() {
  var index = [];

  function insert(key, data) {
    var n0 = index.length,
        n1 = data.length,
        n = n0 + n1;

    if (!n1) return [];

    var add = data
      .map(function(t) { return [key(t), t]; })
      .sort(compare);

    index = n0 ? merge(index, add, Array(n)) : add;

    return add;
  }

  function remove(id, data, map) {
    if (!data.length && !map) return;
    if (!map) {
      map = {};
      var i = 0, n = data.length;
      for (; i<n; ++i) map[id(data[i])] = 1;
    }
    index = index.filter(function(x) { return !map[id(x[1])]; });
  }

  function query(range, visitor) {
    var b = bisect(range);
    visit(b[0], b[1], visitor);
  }

  function visit(a, b, visitor) {
    for (var i=a; i<b; ++i) {
      visitor(index[i][1]);
    }
  }

  function bisect(range, array) {
    array = array || index;
    return [
      bisectLeft(array, range, 0, array.length),
      bisectRight(array, [range[1]], 0, array.length)
    ];
  }

  return {
    insert: insert,
    remove: remove,
    query:  query,
    visit:  visit,
    bisect: bisect,
    index:  function() { return index; },
    clear:  function() { index = []; },
    size:   function() { return index.length; }
  };
}

function merge(index0, index1, index) {
  var n0 = index0.length,
      n1 = index1.length,
      i0 = 0, i1 = 0, i = 0;

  for (; i0<n0 && i1<n1; ++i) {
    index[i] = (index0[i0][0] < index1[i1][0])
       ? index0[i0++]
       : index1[i1++];
  }
  for (; i0<n0; ++i0, ++i) {
    index[i] = index0[i0];
  }
  for (; i1<n1; ++i1, ++i) {
    index[i] = index1[i1];
  }

  return index;
}

function compare(a, b) {
  return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
}

function bisectLeft(a, x, lo, hi) {
  while (lo < hi) {
    var mid = lo + hi >>> 1;
    if (compare(a[mid], x) < 0) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function bisectRight(a, x, lo, hi) {
  while (lo < hi) {
    var mid = lo + hi >>> 1;
    if (compare(a[mid], x) > 0) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
