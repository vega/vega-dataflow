export var Empty = [];

export function array(_) {
  return _ != null ? (Array.isArray(_) ? _ : [_]) : [];
}

export function range(start, stop, step) {
  start = +start;
  stop = +stop;
  step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;

  var i = -1,
      n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
      range = new Array(n);

  while (++i < n) {
    range[i] = start + i * step;
  }

  return range;
}

export function visit(array, filter, visitor) {
  if (filter) {
    for (var i=0, j=0, n=array.length, t; i<n; ++i) {
      if (filter(t=array[i])) visitor(t, j++);
    }
  } else {
    array.forEach(visitor);
  }
}

function compare(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function bisectLeft(a, x, lo, hi) {
  if (arguments.length < 3) lo = 0;
  if (arguments.length < 4) hi = a.length;
  while (lo < hi) {
    var mid = lo + hi >>> 1;
    if (compare(a[mid], x) < 0) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function bisectRight(a, x, lo, hi) {
  if (arguments.length < 3) lo = 0;
  if (arguments.length < 4) hi = a.length;
  while (lo < hi) {
    var mid = lo + hi >>> 1;
    if (compare(a[mid], x) > 0) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

export function permute(array, index) {
  var i = 0, n = array.length, permuted = new Array(n);
  for (; i<n; ++i) {
    permuted[i] = array[index[i]];
  }
  return permuted;
}

export function array8(n) { return new Uint8Array(n); }

export function array16(n) { return new Uint16Array(n); }

export function array32(n) { return new Uint32Array(n); }

export function arrayWiden(array, width) {
  var copy;
  switch (width) {
    case 16: copy = array16(array.length); break;
    case 32: copy = array32(array.length); break;
    default: throw new Error("invalid array width!");
  }
  copy.set(array);
  return copy;
}

export function arrayLengthen(array, length, copy) {
  if (array.length >= length) return array;
  copy = copy || new array.constructor(length);
  copy.set(array);
  return copy;
}

export function indexarray(n, m, array) {
  var copy = (m < 0x101 ? array8 : m < 0x10001 ? array16 : array32)(n);
  if (array) copy.set(array);
  return copy;
}

export function indexrange(n) {
  var range = indexarray(n, n);
  for (var i = -1; ++i < n;) range[i] = i;
  return range;
}

export function indexsort(values, index) {
  index.sort(function(a,b) { return compare(values[a], values[b]); });
  permute(values, index);
}

export function indexmerge(value0, index0, value1, index1, value, index) {
  var n0 = value0.length,
      n1 = value1.length,
      i0 = 0,
      i1 = 0, i;

  for (i=0; i0 < n0 && i1 < n1; ++i) {
    if (value0[i0] < value1[i1]) {
      value[i] = value0[i0];
      index[i] = index0[i0++];
    } else {
      value[i] = value1[i1];
      index[i] = index1[i1++] + n0;
    }
  }

  for (; i0 < n0; ++i0, ++i) {
    value[i] = value0[i0];
    index[i] = index0[i0];
  }

  for (; i1 < n1; ++i1, ++i) {
    value[i] = value1[i1];
    index[i] = index1[i1] + n0;
  }
}

