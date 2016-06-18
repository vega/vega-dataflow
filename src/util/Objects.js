export function isObject(_) {
  return _ === Object(_);
}

export function isString(_) {
  return typeof _ === 'string';
}

export function isFunction(_) {
  return typeof _ === 'function';
}

export var isArray = Array.isArray;

export function extend(_) {
  for (var x, k, i=1, len=arguments.length; i<len; ++i) {
    x = arguments[i];
    for (k in x) { _[k] = x[k]; }
  }
  return _;
}

export function stringValue(x) {
  return isArray(x) ? '[' + x.map(stringValue) + ']'
    : isObject(x) || isString(x) ?
      // Output valid JSON and JS source strings.
      // See http://timelessrepo.com/json-isnt-a-javascript-subset
      JSON.stringify(x).replace('\u2028','\\u2028').replace('\u2029', '\\u2029')
    : x;
}

export function splitPath(p) {
  return String(p)
    .match(/\[(.*?)\]|[^.\[]+/g)
    .map(path_trim);
}

function path_trim(d) {
  return d[0] !== '[' ? d
    : d[1] !== "'" && d[1] !== '"' ? d.slice(1, -1)
    : d.slice(2, -2).replace(/\\(["'])/g, '$1');
}
