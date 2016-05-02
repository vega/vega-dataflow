import {default as Pulse, StopPropagation} from './Pulse';
import Operator from './Operator';
import {stream, events} from './Stream';
import Heap from './util/Heap';

var RANK = 0;

export default function Dataflow() {
  this._clock = 0;
  this._pulse = new Pulse(this);
}

var prototype = Dataflow.prototype;

prototype.touch = function(op, opt) {
  this._pulse.operators().add(op);
  if (opt && opt.skip) op.skip();
};

prototype.add = function(init, func, params) {
  var op = (init instanceof Operator) ? init
    : (init instanceof Function)
      ? ((init.prototype instanceof Operator) ? new init(func, params)
      : new Operator(null, init, func))
    : new Operator(init, func, params);

  op.rank = ++RANK;
  this.touch(op);
  return op;
};

prototype.update = function(op, value, opt) {
  opt = opt || {};
  if (op.set(value) || opt.force) {
    this.touch(op, opt);
  }
  return this;
};

prototype.stream = stream;

prototype.events = events;

prototype.on = function(stream, target, update, params, opt) {
  var self = this,
      op = new Operator(null, update, params);

  stream.apply(function(evt) {
    op._evaluate(evt);
    target.skip();
    self.update(target, op.value, opt).runLater();
  });

  return self;
};

// EVALUATE THE DATAFLOW

prototype.runLater = function() {
  if (this._rid) return;
  var self = this;
  self._rid = setTimeout(function() { self._rid = null; self.run(); }, 0);
};

prototype.run = function() {
  var pq = new Heap(function(a, b) { return a.rank - b.rank; }),
      pulses = {},
      pulse = this._pulse,
      stamp = ++this._clock,
      count = 0,
      op, nextPulse;

  function enqueue(op) {
    var p = pulses[op.id];
    pulses[op.id] = pulse; // use most recent pulse
    if (!p) pq.push(op); // enqueue if not already present
  }

  function getPulse(op) {
    var p = op.source && op.source.pulse;
    return (p && p.stamp === stamp) ? p : pulses[op.id];
  }

  // initialize the pulse
  pulse.stamp = stamp;
  pulse.operators().forEach(enqueue);

  while (pq.size() > 0) {
    // process next operator in queue
    op = pq.pop();
    nextPulse = op.evaluate(getPulse(op));

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

// SAVE / RESTORE DATAFLOW STATE

prototype.save = function(ops) {
  return {
    operators: ops.slice(),
    values: JSON.stringify(ops.map(function(op) { return op.value; }))
  };
};

prototype.restore = function(state) {
  var opt = {skip: true},
      val = JSON.parse(state.values),
      i = 0, n = val.length;
  for (; i<n; ++i) {
    this.update(state.operators[i], val[i], opt);
  }
  return this;
};
