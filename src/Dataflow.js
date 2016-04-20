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
  this.touch(op);
  return op;
};

prototype.touch = function(op, opt) {
  this._pulse.ops.add(op);
  if (opt && opt.skip) op.skip();
};

prototype.define = function(name, init, func, args) {
  var op = this.register(new Operator(init, func, args));
  if (name) this._named[name] = op;
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
  var pq = new Heap(pqCompare),
      pulses = {},
      pulse = this._pulse,
      count = 0,
      op, nextPulse;

  function enqueue(op) {
    var p = pulses[op.id];
    pulses[op.id] = pulse; // use most recent pulse
    if (!p) pq.push(op); // enqueue if not already present
  }

  // initialize the pulse
  pulse.stamp = ++this._clock;
  pulse.ops.forEach(enqueue);

  while (pq.size() > 0) {
    // process next operator in queue
    op = pq.pop();

    nextPulse = op.evaluate(pulses[op.id]);

    // propagate the pulse
    if (nextPulse !== StopPropagation) {
      pulse = nextPulse;
      op.targets.forEach(enqueue);
    }

    // increment visit counter
    ++count;
  }

  this._pulse = new Pulse(this);
  return count;
};

function pqCompare(a, b) {
  return a.rank - b.rank;
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
