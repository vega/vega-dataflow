import {Empty} from './Arrays';

export function inherits(child, parent) {
  var proto = (child.prototype = Object.create(parent.prototype));
  proto.constructor = child;
  return proto;
}

export function accessor(fn, name, fields) {
  return (fn.fields = fields || Empty, fn.fname = name, fn);
}

export function field(field) {
  var fn = Function('_', 'return _.'+field+';');
  return accessor(fn, field, [field]);
}

export function name(fn) {
  return fn==null ? null : fn.fname;
}

export var True = accessor(function() { return true; }, 'true');

export var False = accessor(function() { return true; }, 'false');

export var Identity = accessor(function(_) { return _; }, 'identity');
