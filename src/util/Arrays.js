import {isArray} from './Objects';
import {quantile, ascending} from 'd3-array';

export var Empty = [];

export function array(_) {
  return _ != null ? (isArray(_) ? _ : [_]) : Empty;
}

export function array8(n) { return new Uint8Array(n); }

export function array16(n) { return new Uint16Array(n); }

export function array32(n) { return new Uint32Array(n); }

export function indexExtent(array, f) {
  var i = -1,
      n = array.length,
      a, b, c, u, v;

  if (f == null) {
    while (++i < n) if ((b = array[i]) != null && b >= b) { a = c = b; break; }
    u = v = i;
    while (++i < n) if ((b = array[i]) != null) {
      if (a > b) a = b, u = i;
      if (c < b) c = b, v = i;
    }
  } else {
    while (++i < n) if ((b = f(array[i], i, array)) != null && b >= b) { a = c = b; break; }
    u = v = i;
    while (++i < n) if ((b = f(array[i], i, array)) != null) {
      if (a > b) a = b, u = i;
      if (c < b) c = b, v = i;
    }
  }

  return [u, v];
}

function number(x) {
  return x === null ? NaN : +x;
}

function numbers(array, f) {
  var numbers = [],
      n = array.length,
      i = -1, a;

  if (f == null) {
    while (++i < n) if (!isNaN(a = number(array[i]))) numbers.push(a);
  } else {
    while (++i < n) if (!isNaN(a = number(f(array[i], i, array)))) numbers.push(a);
  }
  return numbers;
}

export function bootstrapCI(array, samples, alpha, f) {
  var values = numbers(array, f),
      n = values.length,
      m = samples,
      a, i, j, mu;

  for (j=0, mu=Array(m); j<m; ++j) {
    for (a=0, i=0; i<n; ++i) {
      a += values[~~(Math.random() * n)];
    }
    mu[i] = a / n;
  }

  return [
    quantile(mu.sort(ascending), alpha/2),
    quantile(mu, 1-(alpha/2))
  ];
}

export function quartiles(array, f) {
  var values = numbers(array, f);

  return [
    quantile(values.sort(ascending), 0.25),
    quantile(values, 0.50),
    quantile(values, 0.75)
  ];
}

export function visit(array, filter, visitor) {
  var i = 0, n = array.length, t;
  if (filter) {
    for (; i<n; ++i) {
      if (t = filter(array[i])) visitor(t, i, array);
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
