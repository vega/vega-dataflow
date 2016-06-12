import Transform from '../Transform';
import {inherits} from '../util/Functions';
import {merge} from '../util/Arrays';

/**
 * Collects all data tuples that pass through this operator.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(*,*): number} [params.sort] - An optional
 *   comparator function for additionally sorting the collected tuples.
 */
export default function Collect(params) {
  Transform.call(this, [], params);
}

var prototype = inherits(Collect, Transform);

prototype.transform = function(_, pulse) {
  var out = pulse.fork(pulse.ALL),
      add = pulse.changed(pulse.ADD),
      mod = pulse.changed(),
      sort = _.sort,
      data = this.value,
      push = function(t) { data.push(t); },
      n = 0, map, adds;

  if (out.rem.length) { // build id map and filter data array
    map = {};
    out.visit(out.REM, function(t) { map[t._id] = 1; ++n; });
    data = data.filter(function(t) { return !map[t._id]; });
  }

  if (sort) {
    if (_.modified('sort') || pulse.modified(sort.fields)) {
      // need to re-sort the full data array
      out.visit(out.ADD, push);
      data.sort(sort);
      mod = true;
    } else if (add) {
      // sort adds only, then merge
      adds = [];
      out.visit(out.ADD, function(t) { adds.push(t); });
      data = merge(sort, data, adds.sort(sort));
    }
  } else if (add) {
    // no sort, so simply add new tuples
    out.visit(out.ADD, push);
  }

  this.modified(mod);
  this.value = out.source = data;
  return out;
};
