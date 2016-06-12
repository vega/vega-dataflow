import {isFunction, stringValue, splitPath} from './Objects';
import {array, Empty} from './Arrays';

export function functor(_) {
  return isFunction(_) ? _ : function() { return _; };
}

export function inherits(child, parent) {
  var proto = (child.prototype = Object.create(parent.prototype));
  proto.constructor = child;
  return proto;
}

export function accessor(fn, fields, name) {
  return (fn.fields = fields || Empty, fn.fname = name, fn);
}

export function field(field, name) {
  var path = splitPath(field).map(stringValue),
      fn = Function('_', 'return _[' + path.join('][') + '];');
  return accessor(fn, [field], name || field);
}

export function fname(fn) {
  return fn==null ? null : fn.fname;
}

export function compare(fields, orders) {
  var code = '',
      cmp = array(fields),
      ord = array(orders),
      n = cmp.length,
//      fields = Array(n--),
      i, f, asc;

  for (i=0; i<=n; ++i) {
    f = cmp[i];
    /*
    asc = f[0] === '+' ? (f=f.slice(1), 1)
        : f[0] === '-' ? (f=f.slice(1), 0) : 1;
    */
    asc = ord[i] !== 'descending';
    code += '(u=a["'+f+'"])' + (asc?'<':'>') + '(v=b["'+f+'"])'
          + '?-1:u' + (asc?'>':'<') + 'v?1:'
          + (i < n ? '' : '0');
    // fields[i] = f;
  }
  var fn = Function('a', 'b', 'var u,v;return ' + code + ';');
  return accessor(fn, cmp);
}

export var Id = field('id');

export var Zero = accessor(function() { return 0; }, Empty, 'zero');

export var One = accessor(function() { return 1; }, Empty, 'one');

export var True = accessor(function() { return true; }, Empty, 'true');

export var False = accessor(function() { return false; }, Empty, 'false');

export var Identity = accessor(function(_) { return _; }, Empty, 'identity');
