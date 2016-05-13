import Transform from './Transform';
import Subflow from './Subflow';
import {inherits} from '../util/Functions';
import {prev} from '../Tuple';

/**
 * Facets a dataflow into a set of subflows based on a key.
 * @constructor
 * @param {function(Dataflow, string): Operator} flowgen - A function that
 *   generates a subflow of operators and returns its root operator.
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.key - The key field to facet by.
 */
export default function Facet(flowgen, params) {
  Transform.call(this, {}, params);
  this.flowgen = flowgen;

  // keep track of active subflows, use as targets array for listeners
  // this allows us to limit propagation to only updated subflows
  var a = this._targets = [];
  a.active = 0;
  a.forEach = function(f) {
    for (var i=0, n=a.active; i<n; ++i) f(a[i], i, a);
  };
}

var prototype = inherits(Facet, Transform);

prototype.transform = function(_, pulse) {
  var self = this,
      pkey = this._key || _.key,
      key = (this._key = _.key),
      rekey = _.modified('key');

  this._targets.active = 0; // reset list of active subflows

  pulse.visit(pulse.ADD, function(t) {
    self.subflow(key(t), pulse).add(t);
  });

  pulse.visit(pulse.REM, function(t) {
    self.subflow(pkey(t), pulse).rem(t);
  });

  if (rekey || pulse.modified(key.fields)) {
    pulse.visit(pulse.MOD, function(t) {
      var pt = prev(t, pulse.stamp),
          k0 = pkey(pt),
          k1 = key(t);
      if (k0 === k1) {
        self.subflow(k1, pulse).mod(t);
      } else {
        self.subflow(k0, pulse).rem(pt);
        self.subflow(k1, pulse).add(t);
      }
    });
  } else if (pulse.mod.length) {
    pulse.visit(pulse.MOD, function(t) {
      self.subflow(key(t), pulse).mod(t);
    });
  }

  if (rekey) {
    pulse.visit(pulse.REFLOW, function(t) {
      var k0 = pkey(t),
          k1 = key(t);
      if (k0 !== k1) {
        self.subflow(k0, pulse).rem(t);
        self.subflow(k1, pulse).add(t);
      }
    });
  }

  return pulse;
};

prototype.subflow = function(key, pulse) {
  var sf = this.value[key], df;
  if (!sf) {
    df = pulse.dataflow;
    sf = df.add(new Subflow(pulse.fork(), this, this.flowgen(df, key)));
    this.value[key] = sf;
    this._targets[this._targets.active++] = sf;
  } else if (sf.value.stamp < pulse.stamp) {
    sf.init(pulse);
    this._targets[this._targets.active++] = sf;
  }
  return sf;
};
