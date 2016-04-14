import Transform from './Transform';

// Filters data tuples according to a predicate function.
// The 'test' parameter provides the predicate function.
export default function Filter(args) {
  Transform.call(this, null, args);
  this._cache = {}; // cache the ids of filtered tuples
}

var prototype = (Filter.prototype = Object.create(Transform.prototype));
prototype.constructor = Filter;

prototype._transform = function(_, pulse) {
  var output = pulse.fork(),
      cache = this._cache,
      test = _.test;

  pulse.rem.forEach(function(x) {
    if (cache[x._id] !== 1) output.rem.push(x);
    else cache[x._id] = 0;
  });

  pulse.add.forEach(function(x) {
    if (test(x)) output.add.push(x);
    else cache[x._id] = 1;
  });

  function update(x) {
    var b = test(x),
        s = (cache[x._id] === 1);
    if (b && s) {
      cache[x._id] = 0;
      output.add.push(x);
    } else if (b && !s) {
      output.mod.push(x);
    } else if (!b && s) {
      // do nothing, keep cache true
    } else { // !b && !s
      output.rem.push(x);
      cache[x._id] = 1;
    }
  }

  pulse.mod.forEach(update);
  if (_.modified('test')) {
    pulse.reflow().forEach(update);
  }

  return output;
};
