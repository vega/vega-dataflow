export function isObject(_) {
  return _ === Object(_);
}

export function isString(_) {
  return typeof _ === 'string';
}

export function isFunction(_) {
  return typeof _ === 'function';
}

export function keys(_) {
  var keys = [], k;
  for (k in _) keys.push(k);
  return keys;
}

export function values(_) {
  var values = [], k;
  for (k in _) values.push(_[k]);
  return values;
}

export function extend(_) {
  for (var x, k, i=1, len=arguments.length; i<len; ++i) {
    x = arguments[i];
    for (k in x) { _[k] = x[k]; }
  }
  return _;
}
