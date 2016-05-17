import {default as Pulse, StopPropagation} from './Pulse';
import MultiPulse from './MultiPulse';
import {events} from './EventStream';
import Operator from './Operator';
import {extend} from './util/Objects';
import {Empty} from './util/Arrays';
import Heap from './util/Heap';

var RANK = 0;
var NO_OPT = {skip:false, force:false};
var SKIP = {skip:true};

/**
 * A dataflow graph for reactive processing of data streams.
 * @constructor
 */
export default function Dataflow() {
  this.clock = 0;
  this.nextPulse = new Pulse(this);
}

var prototype = Dataflow.prototype;

prototype.touch = function(op, options) {
  var opt = options || NO_OPT;
  this.nextPulse.operators().add(op);
  if (opt.skip) op.skip();
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

prototype.update = function(op, value, options) {
  var opt = options || NO_OPT;
  if (op.set(value) || opt.force) {
    this.touch(op, opt);
  }
  return this;
};

prototype.events = function(source, type, filter, apply) {
  return events(source, type, filter, apply);
};

prototype.on = function(stream, target, update, params, options) {
  var self = this,
      opt = extend({}, options, SKIP),
      f = function() { self.touch(target).runLater(); };

  if (update) {
    var op = new Operator(null, update, params);
    op.target = target;
    f = function(evt) {
      op.evaluate(evt);
      self.update(target, op.value, opt).runLater();
    };
  }
  stream.apply(f);

  return self;
};

// EVALUATE THE DATAFLOW

prototype.runLater = function() {
  var self = this;
  if (!self._timerID) {
    self._timerID = setTimeout(function() {
      self._timerID = null;
      self.run();
    }, 0);
  }
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

  // initialize the pulse
  pulse.stamp = stamp;
  pulse.operators().forEach(enqueue);

  while (pq.size() > 0) {
    // process next operator in queue
    op = pq.pop();

    next = op.run(this._getPulse(op, pulses));

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

prototype._getPulse = function(op, pulses) {
  // if the operator has an explicit source, try to pull the pulse from it
  // use the source pulse if current, else copy source data to recent pulse
  var src = op.source, p;
  if (src && Array.isArray(src)) {
    return new MultiPulse(this, this.clock, src.map($pulse));
  } else {
    p = src && src.pulse;
    return !p ? pulses[op.id]
         : (p.stamp === this.clock) ? p // use current source pulse
         : (pulses[op.id].source = p.source, pulses[op.id]); // not current
  }
};

function $pulse(op) { return op.pulse; }

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
