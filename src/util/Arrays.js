import {error} from './Errors';

export var Empty = [];

export function array(_) {
  return _ != null ? (Array.isArray(_) ? _ : [_]) : Empty;
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
  var i = 0, j = 0, n = array.length, t;
  if (filter) {
    for (; i<n; ++i) {
      if (t = filter(array[i])) visitor(t, j++);
    }
  } else {
    array.forEach(visitor);
  }
}

export function merge(compare, array0, array1, output) {
  var n0 = array0.length,
      n1 = array1.length;

  if (!n1) return array0;
  if (!n0) return array1;

  var merged = output || new array0.constructor(n0 + n1),
      i0 = 0, i1 = 0, i = 0;

  for (; i0<n0 && i1<n1; ++i) {
    merged[i] = compare(array0[i0], array1[i1]) > 0
       ? array1[i1++]
       : array0[i0++];
  }

  for (; i0<n0; ++i0, ++i) {
    merged[i] = array0[i0];
  }

  for (; i1<n1; ++i1, ++i) {
    merged[i] = array1[i1];
  }

  return merged;
}

export function defaultComparator(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function bisectLeft(a, x, lo, hi, comparator) {
  if (arguments.length < 3) lo = 0;
  if (arguments.length < 4) hi = a.length;
  var compare = comparator || defaultComparator;

  while (lo < hi) {
    var mid = lo + hi >>> 1;
    if (compare(a[mid], x) < 0) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function bisectRight(a, x, lo, hi, comparator) {
  if (arguments.length < 3) lo = 0;
  if (arguments.length < 4) hi = a.length;
  var compare = comparator || defaultComparator;

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
    default: throw error('Invalid array width.');
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



