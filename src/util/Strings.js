import {isObject} from './Objects';

export function isString(value) {
  return typeof value === 'string'
      || toString.call(value) === '[object String]';
}

export function stringValue(x) {
  return Array.isArray(x) ? '[' + x.map(stringValue) + ']'
    : isObject(x) ? JSON.stringify(x)
    : isString(x) ? ('\'' + string_escape(x) + '\'')
    : x;
}

function string_escape(x) {
  return x.replace(/(^|[^\\])'/g, '$1\\\'');
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
