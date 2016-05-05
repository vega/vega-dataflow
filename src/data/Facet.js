import Transform from './Transform';
import Subflow from './Subflow';
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

  // TODO: add warning if source param is provided?

  // keep track of active subflows, use as targets array for listeners
  // this allows us to limit propagatation to only updated subflows
  var a = this._targets = [];
  a.active = 0;
  a.forEach = function(f) {
    for (var i=0, n=a.active; i<n; ++i) f(a[i], i, a);
  };
}

var prototype = (Facet.prototype = Object.create(Transform.prototype));
prototype.constructor = Facet;

prototype.transform = function(_, pulse) {
  var self = this,
      key = _.key;
      // reset = _.modified('key'); // TODO: handle key change

  this._targets.active = 0; // reset list of active subflows

  pulse.visit(pulse.ADD, function(t) {
    self.subflow(key(t), pulse).add(t);
  });

  pulse.visit(pulse.REM, function(t) {
    self.subflow(key(t), pulse).rem(t);
  });

  var mod = function(t) { self.subflow(key(t), pulse).mod(t); };
  if (pulse.modified(key.fields)) {
    mod = function(t) {
      var pt = prev(t, pulse.stamp),
          k0 = key(pt),
          k1 = key(t);
      if (k0 === k1) {
        self.subflow(k1, pulse).mod(t);
      } else {
        self.subflow(k0, pulse).rem(pt);
        self.subflow(k1, pulse).add(t);
      }
    };
  }
  pulse.visit(pulse.MOD, mod);

  return pulse;
};

prototype.subflow = function(key, pulse) {
  var sf = this.value[key], df;
  if (!sf) {
    df = pulse.dataflow;
    sf = df.add(new Subflow(pulse.fork(), this, this.flowgen(df, key)));
    this.value[key] = sf;
    this._targets[this._targets.active++] = sf; // TODO check performance of push vs. direct index
  } else if (sf.value.stamp < pulse.stamp) {
    sf.init(pulse);
    this._targets[this._targets.active++] = sf;
  }
  return sf;
};
