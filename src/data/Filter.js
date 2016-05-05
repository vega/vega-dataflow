import Transform from './Transform';

// Filters data tuples according to a predicate function.
// The 'test' parameter provides the predicate function.
// The 'source' parameter links to the source data set.
export default function Filter(params) {
  Transform.call(this, {}, params);
}

var prototype = (Filter.prototype = Object.create(Transform.prototype));
prototype.constructor = Filter;

prototype._transform = function(_, pulse) {
  var test = _.test,
      cache = this.value, // cache ids of filtered tuples
      output = pulse.fork(),
      flags = pulse.MOD | (_.modified('test') ? pulse.REFLOW : 0);

  pulse.visit(pulse.REM, function(x) {
    if (cache[x._id] !== 1) output.rem.push(x);
    else cache[x._id] = 0;
  });

  pulse.visit(pulse.ADD, function(x) {
    if (test(x)) output.add.push(x);
    else cache[x._id] = 1;
  });

  pulse.visit(flags, function(x) {
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
  });

  return output;
};
