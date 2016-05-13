import {default as Pulse, StopPropagation} from './Pulse';
import {events} from './EventStream';
import Operator from './Operator';
import {Empty} from './util/Arrays';
import Heap from './util/Heap';

var RANK = 0;

/**
 * A dataflow graph for reactive processing of data streams.
 * @constructor
 */
export default function Dataflow() {
  this.clock = 0;
  this.nextPulse = new Pulse(this);
}

var prototype = Dataflow.prototype;

prototype.touch = function(op, opt) {
  this.nextPulse.operators().add(op);
  if (opt && opt.skip) op.skip();
  return this;
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

prototype.events = function(source, type, filter, apply) {
  return events(source, type, filter, apply);
};

prototype.on = function(stream, target, update, params, opt) {
  var self = this,
      f = function() { self.touch(target).runLater(); };

  if (update) {
    var op = new Operator(null, update, params);
    op.target = target;
    f = function(evt) {
      op.evaluate(evt);
      target.skip();
      self.update(target, op.value, opt).runLater();
    };
  }
  stream.apply(f);

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
      pulse = this.nextPulse,
      stamp = ++this.clock,
      count = 0,
      op, next;

  // reset next pulse prior to propagation
  // touched operators will be queued to run on the next pulse
  this.nextPulse = new Pulse(this);

  function enqueue(op) {
    var p = pulses[op.id];
    pulses[op.id] = pulse; // use most recent pulse
    if (!p) pq.push(op); // enqueue if not already present
  }

  function getPulse(op) {
    // if the operator has an explicit source, try to pull the pulse from it
    // use the source pulse if current, else copy source data to recent pulse
    var p = op.source && op.source.pulse;
    return !p ? pulses[op.id]    // no source pulse to use
      : (p.stamp === stamp) ? p  // use current source pulse
      : (pulses[op.id].source = p.source, pulses[op.id]); // not current
  }

  // initialize the pulse
  pulse.stamp = stamp;
  pulse.operators().forEach(enqueue);

  while (pq.size() > 0) {
    // process next operator in queue
    op = pq.pop();

    next = op.run(getPulse(op));

    // propagate the pulse
    if (next !== StopPropagation) {
      pulse = next;
      (op._targets || Empty).forEach(enqueue);
    }

    // increment visit counter
    ++count;
  }

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
