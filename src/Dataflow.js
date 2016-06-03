import {default as Pulse, StopPropagation} from './Pulse';
import MultiPulse from './MultiPulse';
import {events} from './EventStream';
import Operator from './Operator';
import UniqueList from './util/UniqueList';
import {Id, isFunction} from './util/Functions';
import {extend} from './util/Objects';
import {error, debug, info, Levels, logLevel} from './util/Errors';
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
  this._touched = UniqueList(Id);
  this._postrun = [];
  this._running = false;
}

var prototype = Dataflow.prototype;

prototype.touch = function(op, options) {
  var opt = options || NO_OPT;
  this._touched.add(op);
  if (opt.skip) op.skip(true);
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
      f = function() { self.touch(target).run(); };

  if (update) {
    if (isFunction(update)) {
      var op = new Operator(null, update, params);
      op.target = target;
      f = function(evt) {
        op.evaluate(evt);
        self.update(target, op.value, opt).run();
      };
    } else {
      f = function() { self.update(target, update, opt).run(); };
    }
  }
  stream.apply(f);

  return self;
};

// EVALUATE THE DATAFLOW

prototype.run = function() {
  this._running = true;

  var pq = new Heap(function(a, b) { return a.rank - b.rank; }),
      pulses = {},
      pulse = this.nextPulse,
      stamp = ++this.clock,
      ops = this._touched,
      count = 0,
      level = logLevel(),
      op, next, dt;

  if (level >= Levels.Info) {
    dt = Date.now();
    debug('-- START PROPAGATION (' + stamp + ') -----');
  }

  // initialize current pulse, reset next pulse
  pulse.stamp = stamp;
  this.nextPulse = new Pulse(this);

  function enqueue(op) {
    var p = pulses[op.id];
    pulses[op.id] = pulse; // use most recent pulse
    if (!p) pq.push(op); // enqueue if not already present
  }

  ops.forEach(enqueue); // initialize queue

  while (pq.size() > 0) {
    // process next operator in queue
    op = pq.pop();

    next = op.run(this._getPulse(op, pulses));

    if (level >= Levels.Debug) {
      debug(
        'Op: ' + op.id + ', rank:' + op.rank + ' ' + op.constructor.name,
        next === StopPropagation ? 'STOP' : {pulse: next},
        {value: op.value}
      );
    }

    // propagate the pulse
    if (next !== StopPropagation) {
      pulse = next;
      (op._targets || Empty).forEach(enqueue);
    }
    if (level >= Levels.Debug) {
      debug('Heap', pq.nodes.map(Id));
    }

    // increment visit counter
    ++count;
  }

  this._running = false;
  if (this._postrun.length) { // TODO: timeout?
    this._postrun.forEach(function(f) { f(); });
    this._postrun = [];
  }

  if (level >= Levels.Info) {
    dt = Date.now() - dt;
    info('> Pulse ' + stamp + ': ' + count + ' operators; ' + dt + ' ms');
  }

  this._touched = UniqueList(Id);
  return count;
};

prototype.runAfter = function(pulse, func) {
  if (pulse.stamp !== this.clock) {
    error('Can only schedule runAfter on the current timestamp.');
  }
  if (this._running) {
    // pulse propagation is currently running, queue to run after
    this._postrun.push(func);
  } else {
    // pulse propagation already complete, invoke immediately
    func();
  }
};

function $pulse(op) { return op.pulse; }

prototype._getPulse = function(op, pulses) {
  // if the operator has an explicit source, try to pull the pulse from it
  var src = op.source, p;
  if (src && Array.isArray(src)) {
    // if source array, conslidate pulses into a multi-pulse
    return new MultiPulse(this, this.clock, src.map($pulse));
  } else {
    // otherwise, return curent pulse with correct source data
    // use source pulse if current, else copy source to current pulse
    p = src && src.pulse;
    return !p ? pulses[op.id]
         : (p.stamp === this.clock) ? p // use current source pulse
         : (pulses[op.id].source = p.source, pulses[op.id]); // copy source
  }
};


// SAVE / RESTORE DATAFLOW STATE

prototype.save = function(ops) {
  return {
    operators: ops.slice(),
    values: JSON.stringify(ops.map(function(op) { return op.value; }))
  };
};

prototype.restore = function(state) {
  var opt = SKIP,
      val = JSON.parse(state.values),
      i = 0, n = val.length;
  for (; i<n; ++i) {
    this.update(state.operators[i], val[i], opt);
  }
  return this;
};
