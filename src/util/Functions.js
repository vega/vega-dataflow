import {isFunction, stringValue, splitPath} from './Objects';
import {array, Empty} from './Arrays';
import {error} from './Errors';

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
  if (field == null) error('Missing field argument.');
  var path = splitPath(field).map(stringValue),
      fn = Function('_', 'return _[' + path.join('][') + '];');
  return accessor(fn, [field], name || field);
}

export function fname(fn) {
  return fn==null ? null : fn.fname;
}

export function compare(fields, orders) {
  if (fields == null) return null;
  fields = array(fields);

  var cmp = fields.map(function(f) {
        return splitPath(f).map(stringValue).join('][');
      }),
      ord = array(orders),
      n = cmp.length - 1,
      code = 'var u,v;return ', i, f, u, v, x, y, lt, gt;

  for (i=0; i<=n; ++i) {
    f = cmp[i];
    u = '(u=a['+f+'])';
    v = '(v=b['+f+'])';
    x = '(u=u instanceof Date?+u:u)';
    y = '(v=v instanceof Date?+v:v)';

    lt = ord[i] !== 'descending' ? (gt=1, -1) : (gt=-1, 1);
    code += u+'<'+v+'&&v!==null?' + lt
      + ':u>v&&u!==null?' + gt
      + ':'+x+'!=='+y+'&&v!=null&&v===v?' + lt
      + ':u!==v&&u!=null&&u===u?' + gt
      + (i < n ? ':' : ':0');
  }
  return accessor(Function('a', 'b', code + ';'), fields);
}

export var Id = field('id');

export var Zero = accessor(function() { return 0; }, Empty, 'zero');

export var One = accessor(function() { return 1; }, Empty, 'one');

export var True = accessor(function() { return true; }, Empty, 'true');

export var False = accessor(function() { return false; }, Empty, 'false');

export var Identity = accessor(function(_) { return _; }, Empty, 'identity');
