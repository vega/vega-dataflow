import Transform from './Transform';
import {inherits} from '../util/Functions';

/**
 * Compute rank order scores for tuples. The tuples are assumed to have been
 * sorted in the desired rank orderby an upstream data source.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Map} params.index - The lookup table map.
 * @param {Array<function(object): *} params.keys - The lookup keys.
 * @param {Array<string>} params.as - The per-key output field names.
 * @param {*} [params.default] - A default value to use if lookup fails.
 */
export default function Lookup(params) {
  Transform.call(this, {}, params);
}

var prototype = inherits(Lookup, Transform);

prototype.transform = function(_, pulse) {
  var out = pulse,
      as = _.as,
      index = _.index,
      keys = _.keys,
      defaultValue = _.default==null ? null : _.default,
      reset = _.modified(),
      flag = pulse.ADD,
      set, key, field, mods;

  if (keys.length === 1) {
    key = keys[0];
    field = as[0];
    set = function(t) {
      var v = index.get(key(t));
      t[field] = v==null ? defaultValue : v;
    };
  } else {
    set = function(t) {
      for (var i=0, n=keys.length, v; i<n; ++i) {
        v = index.get(keys[i](t));
        t[as[i]] = v==null ? defaultValue : v;
      }
    };
  }

  if (reset) {
    flag = pulse.SOURCE;
    out = pulse.fork(pulse.ALL).reflow();
  } else {
    mods = keys.some(function(k) { return pulse.modified(k.fields); });
    flag |= (mods ? pulse.MOD : 0);
  }
  pulse.visit(flag, set);

  return out.modifies(as);
};
