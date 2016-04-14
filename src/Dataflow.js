import {default as Pulse, StopPropagation} from './Pulse';
import Operator from './Operator';
import Heap from './util/Heap';
import {Empty} from './util/Objects';

var RANK = 0;

export default function Dataflow() {
  this._clock = 0;
  this._named = {};
  this._pulse = new Pulse(this);
}

var prototype = Dataflow.prototype;

prototype.register = function(op) {
  op.rank = ++RANK;
  return op;
};

prototype.touch = function(op, opt) {
  this._pulse.ops.add(op);
  if (opt.skip) op.skip();
};

prototype.define = function(name, init, func, args) {
  var op = this.register(new Operator(init, func, args));
  if (name) this._named[name] = op;
  this._pulse.ops.add(op);
  return op;
};

prototype.value = function(name) {
  return this._named[name].value;
};

prototype.update = function(name, value, opt) {
  opt = opt || Empty;
  var op = this._named[name];
  if (op.set(value) || opt.force) {
    this.touch(op, opt);
  }
  return this;
};

prototype.updateAll = function(_, opt) {
  for (var name in _) {
    this.update(name, _[name], opt);
  }
  return this;
};

// EVALUATE THE DATAFLOW

prototype.run = function() {
  function add(op) { enqueue(pq, op); }

  var pulse = this._pulse,
      pq = new Heap(compareNodes),
      op, nextPulse;

  pulse.stamp = ++this._clock;
  pulse.ops.forEach(add);
  while (pq.size() > 0) {
    op = pq.pop();
    nextPulse = op.evaluate(pulse);

    if (nextPulse !== StopPropagation) {
      // Propagate the pulse.
      pulse = nextPulse;
      op.targets.forEach(add);
    }
  }

  this._pulse = new Pulse(this);
  return pulse.ops.length > 0;
};

function compareNodes(a, b) {
  return a.rank - b.rank;
}

function enqueue(pq, op) {
  pq.push(op);
}

// SAVE / RESTORE DATAFLOW STATE

prototype.save = function() {
  var named = this._named,
      ops = {};
  for (var name in named) {
    ops[name] = named[name].value;
  }
  return {ops: ops};
};

prototype.restore = function(state) {
  this.updateAll(state.ops, {skip: true});
};
