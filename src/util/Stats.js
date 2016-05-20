import {field, Identity} from './Functions';
import {defaultComparator} from './Arrays';

/**
 * Tests if a value is non-null, defined, and not NaN.
 */
export function valid(v) {
  return v != null && v === v;
}

/**
 * Sums an array of numerical values, ignoring invalid values.
 */
export function sum(values, f) {
  for (var sum=0, i=0, n=values.length, v; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (valid(v)) sum += v;
  }
  return sum;
}

/**
 * Count the number of distinct values.
 * Null, undefined and NaN are each considered distinct values.
 */
export function distinct(values, f) {
  var u = {}, v, i, n, count = 0;
  for (i=0, n=values.length; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (v in u) continue;
    u[v] = 1;
    count += 1;
  }
  return count;
}

/**
 * Find the integer indices of the minimum and maximum values.
 */
export function indexExtent(values, f) {
  var x = -1,
      y = -1,
      n = values.length,
      a, b, v, i;

  for (i=0; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (valid(v)) { a = b = v; x = y = i; break; }
  }

  for (; i<n; ++i) {
    v = f ? f(values[i]) : values[i];
    if (valid(v)) {
      if (v < a) { a = v; x = i; }
      if (v > b) { b = v; y = i; }
    }
  }

  return [x, y];
}

/**
 * Computes the quartile boundaries of an array of numbers.
 */
export function quartile(values, f) {
  if (f) values = values.map(field(f));
  values = values.filter(valid).sort(defaultComparator);
  return [
    quantile(values, 0.25),
    quantile(values, 0.50),
    quantile(values, 0.75)
  ];
}

/**
 * Compute the quantile of a sorted array of numbers.
 * Adapted from the D3.js implementation.
 */
export function quantile(values, f, p) {
  if (p === undefined) { p = f; f = Identity; }
  var H = (values.length - 1) * p + 1,
      h = Math.floor(H),
      v = +f(values[h - 1]),
      e = H - h;
  return e ? v + e * (f(values[h]) - v) : v;
}
