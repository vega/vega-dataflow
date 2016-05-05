import Transform from './Transform';
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

  pulse.visit(pulse.ADD, function(t) { self.getFacet(key(t), pulse).add(t); });
  pulse.visit(pulse.REM, function(t) { self.getFacet(key(t), pulse).rem(t); });

  var mod = function(t) { self.getFacet(key(t), pulse).mod(t); };
  if (pulse.modified(key.fields)) {
    mod = function(t) {
      var pt = prev(t),
          k0 = key(pt),
          k1 = key(t);
      if (k0 === k1) {
        self.getFacet(k1, pulse).mod(t);
      } else {
        self.getFacet(k0, pulse).rem(pt);
        self.getFacet(k1, pulse).add(t);
      }
    };
  }
  pulse.visit(pulse.MOD, mod);

  return pulse;
};

prototype.getFacet = function(key, pulse) {
  var f = this.value[key];
  return f ? f.set(pulse) : (this.value[key] = this.createFacet(key, pulse));
};

prototype.createFacet = function(key, pulse) {
  var facet = {
    pulse: pulse.fork(),
    key: key,
    op:  this,
    add: function(t) { this.pulse.add.push(t); },
    rem: function(t) { this.pulse.rem.push(t); },
    mod: function(t) { this.pulse.mod.push(t); },
    set: function(pulse) {
      if (pulse.stamp > this.pulse.stamp) this.pulse.init(pulse);
      return this;
    },
    connect: function() {
      this.target.source = this;
      this.op.targets().add(this.target);
    },
    disconnect: function() {
      this.op.targets().remove(this.target);
    },
    target: this._flowgen(pulse.dataflow, key)
  };
  facet.connect();
  return facet;
};
