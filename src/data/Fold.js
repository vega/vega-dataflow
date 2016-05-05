import Transform from './Transform';
import {derive, rederive} from '../Tuple';

// parameter 'fields'
export default function Fold(params) {
  Transform.call(this, {}, params);
}

var prototype = (Fold.prototype = Object.create(Transform.prototype));
prototype.constructor = Fold;

function key(f) {
  return f.fields.join('|');
}

prototype._transform = function(_, pulse) {
  var cache = this.value,
      reset = _.modified('fields'),
      fields = _.fields,
      keys = fields.map(key),
      n = fields.length,
      stamp = pulse.stamp,
      out = pulse.fork(),
      i = 0, mask = 0, id;

  function add(t) {
    var f = (cache[t._id] = Array(n)); // create cache of folded tuples
    for (var i=0, ft; i<n; ++i) { // for each key, derive folds
      ft = (f[i] = derive(t));
      ft.key = keys[i];
      ft.value = fields[i](t);
      out.add.push(ft);
    }
  }

  function mod(t) {
    var f = cache[t._id]; // get cache of folded tuples
    for (var i=0, ft; i<n; ++i) { // for each key, rederive folds
      if (!(mask & (1 << i))) continue; // field is unchanged
      ft = rederive(t, f[i], stamp);
      ft.key = keys[i];
      ft.value = fields[i](t);
      out.mod.push(ft);
    }
  }

  if (reset) {
    // on reset, remove all folded tuples and clear cache
    for (id in cache) out.rem.push.apply(out.rem, cache[id]);
    cache = this.value = {};
    pulse.visit(pulse.SOURCE, add);
  } else {
    pulse.visit(pulse.ADD, add);

    for (; i<n; ++i) {
      if (pulse.modified(fields[i].fields)) mask |= (1 << i);
    }
    if (mask) pulse.visit(pulse.MOD, mod);

    pulse.visit(pulse.REM, function(t) {
      out.rem.push.apply(out.rem, cache[t._id]);
      cache[t._id] = null;
    });
  }

  return out.modifies(['key', 'value']);
};
