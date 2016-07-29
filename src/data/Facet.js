import Transform from '../Transform';
import Subflow from './Subflow';
import {inherits} from 'vega-util';
import {map} from 'd3-collection';

/**
 * Facets a dataflow into a set of subflows based on a key.
 * @constructor
 * @param {function(Dataflow, string): Operator} subflow - A function that
 *   generates a subflow of operators and returns its root operator.
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.key - The key field to facet by.
 */
export default function Facet(params) {
  Transform.call(this, map(), params);
  this._keys = {}; // cache previously calculated key values
  this._count = 0; // count of subflows

  // keep track of active subflows, use as targets array for listeners
  // this allows us to limit propagation to only updated subflows
  var a = this._targets = [];
  a.active = 0;
  a.forEach = function(f) {
    for (var i=0, n=a.active; i<n; ++i) f(a[i], i, a);
  };
}

var prototype = inherits(Facet, Transform);

prototype.activate = function(flow) {
  this._targets[this._targets.active++] = flow;
};

prototype.transform = function(_, pulse) {
  var self = this,
      lut = this.value,
      key = _.key,
      cache = this._keys,
      rekey = _.modified('key');

  // subflow generator
  function subflow(key) {
    var sf = lut.get(key), df;
    if (!sf) {
      df = pulse.dataflow;
      sf = df.add(new Subflow(pulse.fork(), self))
        .connect(_.subflow(df, key, self._count++));
      lut.set(key, sf);
      self.activate(sf);
    } else if (sf.value.stamp < pulse.stamp) {
      sf.init(pulse);
      self.activate(sf);
    }
    return sf;
  }

  this._targets.active = 0; // reset list of active subflows

  pulse.visit(pulse.ADD, function(t) {
    subflow(cache[t._id] = key(t)).add(t);
  });

  pulse.visit(pulse.REM, function(t) {
    var k = cache[t._id];
    cache[t._id] = null;
    subflow(k).rem(t);
  });

  if (rekey || pulse.modified(key.fields)) {
    pulse.visit(pulse.MOD, function(t) {
      var k0 = cache[t._id],
          k1 = key(t);
      if (k0 === k1) {
        subflow(k1).mod(t);
      } else {
        cache[t._id] = k1;
        subflow(k0).rem(t);
        subflow(k1).add(t);
      }
    });
  } else if (pulse.changed(pulse.MOD)) {
    pulse.visit(pulse.MOD, function(t) {
      subflow(cache[t._id]).mod(t);
    });
  }

  if (rekey) {
    pulse.visit(pulse.REFLOW, function(t) {
      var k0 = cache[t._id],
          k1 = key(t);
      if (k0 !== k1) {
        cache[t._id] = k1;
        subflow(k0).rem(t);
        subflow(k1).add(t);
      }
    });
  }

  return pulse;
};
