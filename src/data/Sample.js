import Transform from '../Transform';
import {inherits} from '../util/Functions';

/**
 * Samples tuples passing through this operator.
 * Uses reservoir sampling to maintain a representative sample.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {number} [params.num=1000] - The maximum number of samples per strata.
 * @param {function(object): *} [params.key] - A key field for stratified sampling.
 */
export default function Sample(params) {
  Transform.call(this, [], params);
  this.count = 0;
}

var prototype = inherits(Sample, Transform);

prototype.transform = function(_, pulse) {
  var out = pulse.fork(),
      num = _.num,
      res = this.value,
      cnt = this.count,
      cap = 0,
      map = res.reduce(function(m, t) { return (m[t._id] = 1, m); }, {});

  // sample reservoir update function
  function update(t) {
    var p, idx;

    if (res.length < num) {
      res.push(t);
    } else {
      idx = ~~(cnt * Math.random());
      if (idx < res.length && idx >= cap) {
        p = res[idx];
        if (map[p._id]) out.rem.push(p); // eviction
        res[idx] = t;
      }
    }
    ++cnt;
  }

  if (pulse.rem.length) {
    // find all tuples that should be removed, add to output
    pulse.visit(pulse.REM, function(t) {
      if (map[t._id]) {
        map[t._id] = -1;
        out.rem.push(t);
      }
      --cnt;
    });

    // filter removed tuples out of the sample reservoir
    res = res.filter(function(t) { return map[t._id] !== -1; });

    // replenish sample if backing data source is available
    if (res.length < num && pulse.source) {
      cap = cnt = res.length;
      pulse.visit(pulse.SOURCE, function(t) {
        // update, but skip previously sampled tuples
        if (!map[t._id]) update(t);
      });
      cap = -1;
    }
  }

  if (pulse.mod.length) {
    // propagate modified tuples in the sample reservoir
    pulse.visit(pulse.MOD, function(t) {
      if (map[t._id]) out.mod.push(t);
    });
  }

  if (pulse.add.length) {
    // update sample reservoir
    pulse.visit(pulse.ADD, update);
  }

  if (pulse.add.length || cap < 0) {
    // output newly added tuples
    out.add = res.filter(function(t) { return !map[t._id]; });
  }

  this.count = cnt;
  this.value = out.source = res;
  return out;
};
