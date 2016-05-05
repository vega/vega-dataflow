import Transform from './Transform';
import Subflow from './Subflow';
import {prev} from '../Tuple';

// parameter 'key'
export default function Facet(flowgen, params) {
  Transform.call(this, {}, params);
  this._flowgen = flowgen;
}

var prototype = (Facet.prototype = Object.create(Transform.prototype));
prototype.constructor = Facet;

prototype._transform = function(_, pulse) {
  var self = this,
      key = _.key;
      // reset = _.modified('key'); // TODO: handle key change

  this.touchFlows(pulse);

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
    sf = df.add(new Subflow(pulse.fork(), this, this._flowgen(df, key)));
    this.value[key] = sf.connect();
  }
  return sf;
};

prototype.touchFlows = function(pulse) {
  var flows = this.value, key;
  for (key in flows) flows[key].touch(pulse);
};
