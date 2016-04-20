import {array} from './util/Arrays';
import {idFilter} from './Tuple';
import UniqueList from './util/UniqueList';

export var StopPropagation = {};

export default function Pulse(dataflow) {
  this.dataflow = dataflow;
  this.stamp = -1;
  this.ops = UniqueList();

  this.add = [];
  this.rem = [];
  this.mod = [];
}

var prototype = Pulse.prototype;

prototype.StopPropagation = StopPropagation;

prototype.fork = function() {
  var p = new Pulse(this.dataflow);
  p.stamp = this.stamp;
  if (this.fields) p.fields = this.fields;
  return p;
}

// TODO: refactor to take a visitor instead? (Avoid array construction.)
prototype.reflow = function(source) {
  return idFilter(source, this.add, this.mod, this.rem);
};

prototype.modifies = function(_) {
  var fields = array(_);
  var hash = this.fields || (this.fields = {});
  fields.forEach(function(f) { hash[f] = 1; });
  return this;
};

prototype.modified = function(_) {
  var fields = this.fields;
  return !fields ? 0
    : array(_).some(function(f) { return fields[f]; });
};
