import {Empty, array} from './Arrays';

export function isFunction(_) {
  return typeof _ === 'function';
}

export function inherits(child, parent) {
  var proto = (child.prototype = Object.create(parent.prototype));
  proto.constructor = child;
  return proto;
}

export function accessor(fn, name, fields) {
  return (fn.fields = fields || Empty, fn.fname = name, fn);
}

// TODO: nested fields
export function field(field, name) {
  var fn = Function('_', 'return _.'+field+';');
  return accessor(fn, name || field, [field]);
}

export function name(fn) {
  return fn==null ? null : fn.fname;
}

export function compare(_) {
  var code = '',
      cmp = array(_),
      n = cmp.length,
      fields = Array(n--),
      i, f, asc;

  for (i=0; i<=n; ++i) {
    f = cmp[i];
    asc = f[0] === '+' ? (f=f.slice(1), 1)
        : f[0] === '-' ? (f=f.slice(1), 0) : 1;
    code += '(u=a["'+f+'"])' + (asc?'<':'>') + '(v=b["'+f+'"])'
          + '?-1:u' + (asc?'>':'<') + 'v?1:'
          + (i < n ? '' : '0');
    fields[i] = f;
  }
  var fn = Function('a', 'b', 'var u,v;return ' + code + ';');
  return accessor(fn, null, fields);
}

export var Id = field('id');

export var Zero = accessor(function() { return 0; }, 'zero');

export var One = accessor(function() { return 1; }, 'one');

export var True = accessor(function() { return true; }, 'true');

export var False = accessor(function() { return false; }, 'false');

export var Identity = accessor(function(_) { return _; }, 'identity');
