import Transform from './Transform';
import {inherits} from '../util/Functions';

/**
 * Filters data tuples according to a predicate function.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.test - The predicate function that
 *   determines a tuple's filter status. Truthy values pass the filter.
 */
export default function Filter(params) {
  Transform.call(this, {}, params);
}

var prototype = inherits(Filter, Transform);

prototype.transform = function(_, pulse) {
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
