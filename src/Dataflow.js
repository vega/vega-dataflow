import {default as Pulse, StopPropagation} from './Pulse';
import MultiPulse from './MultiPulse';
import Operator from './Operator';
import {isChangeSet} from './ChangeSet';
import {stream} from './EventStream';

import UniqueList from './util/UniqueList';
import {Id, functor} from './util/Functions';
import {extend, isFunction, isArray} from './util/Objects';
import {error, debug, info, Levels, logLevel} from './util/Errors';
import {Empty, array} from './util/Arrays';
import Heap from './util/Heap';

var RANK = 1;
var NO_OPT = {skip: false, force: false};
var SKIP = {skip: true};

/**
 * A dataflow graph for reactive processing of data streams.
 * @constructor
 */
export default function Dataflow() {
  this._clock = 0;
  this._pulses = {};
  this._touched = UniqueList(Id);
  this._postrun = [];
  this._running = false;
}

var prototype = Dataflow.prototype;

/**
 * The current timestamp of this dataflow. This value reflects the
 * timestamp of the previous dataflow run. The dataflow is initialized
 * with a stamp value of 0. The initial run of the dataflow will have
 * a timestap of 1, and so on. This value will match the
 * {@link Pulse.stamp} property.
 * @return {number} - The current timestamp value.
 */
prototype.stamp = function() {
  return this._clock;
};

/**
 * Touches an operator, ensuring that it will be processed by the
 * scheduler next time the dataflow is run.
 * @param {Operator} op - The operator to touch.
 * @param {object} [options] - Additional options hash.
 * @param {boolean} [options.skip] - If true, the operator will
 *   be skipped: it will not be evaluated, but its dependents will be.
 * @return {Dataflow}
 */
prototype.touch = function(op, options) {
  var opt = options || NO_OPT;
  this._touched.add(op);
  if (opt.skip) op.skip(true);
  return this;
};

/**
 * Add an operator to the dataflow graph. This function accepts a
 * variety of input argument types. The basic signature support an
 * initial value, update function and parameters. If the first parameter
 * is an Operator instance, it will be added directly. If it is a
 * constructor for an Operator subclass, a new instance will be instantiated.
 * Otherwise, if the first parameter is a function instance, it will be used
 * as the update function and a null initial value is assumed.
 * @param {*} init - One of: the operator to add, the initial value of
 *   the operator, an operator class to instantiate, or an update function.
 * @param {function} [func] - The operator update function.
 * @param {object} [params] - The operator parameters.
 * @return {Operator} - The added operator.
 */
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

/**
 * Updates the value of the given operator.
 * @param {Operator} op - The operator to update.
 * @param {*} value - The value to set.
 * @param {object} [options] - Additional options hash.
 * @param {boolean} [options.force] - If true, the operator will
 *   be re-evaluated even if its value has not changed.
 * @param {boolean} [options.skip] - If true, the operator will
 *   be skipped: it will not be evaluated, but its dependents will be.
 * @return {Dataflow}
 */
prototype.update = function(op, value, options) {
  var opt = options || NO_OPT;
  if (op.set(value) || opt.force) {
    this.touch(op, opt);
  }
  return this;
};

/**
 * Pulses an operator with a changeset of tuples. The pulse will be
 * applied the next time the dataflow is run.
 * @param {Operator} op - The operator to pulse.
 * @param {ChangeSet} value - The tuple changeset to apply.
 * @param {object} [options] - Additional options hash.
 * @param {boolean} [options.skip] - If true, the operator will
 *   be skipped: it will not be evaluated, but its dependents will be.
 * @return {Dataflow}
 */
prototype.pulse = function(op, changeset, options) {
  var p = new Pulse(this, this._clock + 1);
  p.target = op;
  this._pulses[op.id] = changeset.pulse(p, op.value);
  return this.touch(op, options || NO_OPT);
};

// EVENT HANDLING

/**
 * Create a new event stream from an event source.
 * @param {object} source - The event source to monitor. The input must
 *  support the addEventListener method.
 * @param {string} type - The event type.
 * @param {function(object): boolean} [filter] - Event filter function.
 * @param {function(object): *} [apply] - Event application function.
 *   If provided, this function will be invoked and the result will be
 *   used as the downstream event value.
 * @return {EventStream}
 */
prototype.events = function(source, type, filter, apply) {
  var df = this,
      s = stream(filter, apply),
      send = function(e) {
        e.dataflow = df;
        s.receive(e);
        df.run();
      },
      sources;

  if (typeof source === 'string' && typeof document !== 'undefined') {
    sources = document.querySelectorAll(source);
  } else {
    sources = array(source);
  }

  for (var i=0, n=sources.length; i<n; ++i) {
    sources[i].addEventListener(type, send);
  }

  return s;
}

/**
 * Perform operator updates in response to events. Applies an
 * update function to compute a new operator value. If the update function
 * returns a {@link ChangeSet}, the operator will be pulsed with those tuple
 * changes. Otherwise, the operator value will be updated to the return value.
 * @param {EventStream|Operator} source - The event source to react to.
 *   This argument can be either an EventStream or an Operator.
 * @param {Operator|function(object):Operator} target - The operator to update.
 *   This argument can either be an Operator instance or (if the source
 *   argument is an EventStream), a function that accepts an event object as
 *   input and returns an Operator to target.
 * @param {function(Parameters,Event): *} [update] - Optional update function
 *   to compute the new operator value, or a literal value to set. Update
 *   functions expect to receive a parameter object and event as arguments.
 *   This function can either return a new operator value or (if the source
 *   argument is an EventStream) a {@link ChangeSet} instance to pulse
 *   the target operator with tuple changes.
 * @param {object} [params] - The update function parameters.
 * @param {object} [options] - Additional options hash. If not overridden,
 *   updated operators will be skipped by default.
 * @param {boolean} [options.skip] - If true, the operator will
 *  be skipped: it will not be evaluated, but its dependents will be.
 * @param {boolean} [options.force] - If true, the operator will
 *   be re-evaluated even if its value has not changed.
 * @return {Dataflow}
 */
prototype.on = function(source, target, update, params, options) {
  var fn = source instanceof Operator ? onOperator : onStream;
  return fn(this, source, target, update, params, options), this;
};

function onStream(df, stream, target, update, params, options) {
  var opt = extend({}, options, SKIP), func, op;

  if (!isFunction(target)) target = functor(target);

  if (update === undefined) {
    func = function(e) {
      df.touch(target(e));
    };
  } else if (isFunction(update)) {
    op = new Operator(null, update);
    op.parameters(params, true); // don't subscribe to operators
    func = function(e) {
      var t = target(e),
          v = (op.evaluate(e), op.value);
      isChangeSet(v) ? df.pulse(t, v, options) : df.update(t, v, opt);
    };
  } else {
    func = function(e) {
      df.update(target(e), update, opt);
    };
  }

  stream.apply(func);
}

function onOperator(df, source, target, update, params) {
  var func, op;

  if (update === undefined) {
    op = target;
  } else {
    func = isFunction(update) ? update : functor(update);
    op = new Operator(null, function(_, pulse) {
      target.skip(true).set(func(_, pulse));
    });
    op.parameters(params, true);
    op.modified(true);
    op.rank = 0;
  }

  source.targets().add(op);
}

// RUN PROPAGATION CYCLE

/**
 * Runs the dataflow. This method will increment the current timestamp
 * and process all updated, pulsed and touched operators. When run for
 * the first time, all registered operators will be processed.
 */
prototype.run = function() {
  if (!this._touched.length) return 0;

  this._running = true;

  var pq = new Heap(function(a, b) { return a.rank - b.rank; }),
      pulses = this._pulses,
      pulse = new Pulse(this, ++this._clock),
      level = logLevel(),
      count = 0, op, next, dt;

  if (level >= Levels.Info) {
    dt = Date.now();
    debug('-- START PROPAGATION (' + pulse.stamp + ') -----');
  }

  // initialize queue
  this._touched.forEach(function(op) {
    if (!pulses[op.id]) pulses[op.id] = pulse;
    pq.push(op);
  });

  // reset dataflow state
  this._touched = UniqueList(Id);
  this._pulses = {};

  while (pq.size() > 0) {
    op = pq.pop(); // process next operator in queue
    next = op.run(getPulse(this, this._clock, op, pulses));

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
      (op._targets || Empty).forEach(function(op) {
        if (!pulses[op.id]) pq.push(op), pulses[op.id] = pulse;
      });
    }

    // increment visit counter
    ++count;
  }

  // invoke callbacks queued via runAfter
  this._running = false;
  if (this._postrun.length) {
    this._postrun.forEach(function(f) { f(); });
    this._postrun = [];
  }

  if (level >= Levels.Info) {
    dt = Date.now() - dt;
    info('> Pulse ' + pulse.stamp + ': ' + count + ' operators; ' + dt + 'ms');
  }

  return count;
};

/**
 * Schedules a callback function to be invoked after the given pulse
 * completes. If the pulse has completed, the function is invoked
 * immediately. If the input pulse does not have a stamp value matching
 * the current timestamp, an error will be raised.
 * @param {Pulse} pulse - The pulse to run after.
 * @param {function()} callback - The callback function to run.
 */
prototype.runAfter = function(pulse, callback) {
  if (pulse.stamp !== this._clock) {
    error('Can only schedule runAfter on the current timestamp.');
  }
  if (this._running) {
    // pulse propagation is currently running, queue to run after
    this._postrun.push(callback);
  } else {
    // pulse propagation already complete, invoke immediately
    callback();
  }
};

function getPulse(df, stamp, op, pulses) {
  // if the operator has an explicit source, try to pull the pulse from it
  var s = op.source, p, q;
  if (s && isArray(s)) {
    // if source array, consolidate pulses into a multi-pulse
    return new MultiPulse(df, stamp, s.map(function(_) { return _.pulse; }));
  } else {
    // return current pulse with correct source data; copy source as needed
    // priority: 1. pulse with explicit target, 2. current pulse from source
    q = pulses[op.id];
    p = (s && (s=s.pulse) && s.stamp === stamp && q.target !== op) ? s : q;
    if (s) p.source = s.source;
    return p;
  }
}

// SAVE / RESTORE DATAFLOW STATE

/**
 * Serialize a snapshot of current operator states.
 * @param {Array<Operator>} ops - The operators whose state should be saved.
 * @return {string} - JSON-encoded state vector.
 */
prototype.save = function(ops) {
  return JSON.stringify(ops.map(function(op) { return op.value; }));
};

/**
 * Restore operator states to a previous snapshot. The input operators
 * must exactly match with the serialized state values, otherwise the
 * behavior of this method is undefined.
 * @param {Array<Operator>} ops - The operators to restore.
 * @param {string} state - JSON-encoded state vector.
 */
prototype.restore = function(ops, state) {
  var val = JSON.parse(state.values),
      i = 0, n = val.length;

  if (ops.length !== n) {
    error('Dataflow restore state length should match input operators.');
  }
  for (; i<n; ++i) {
    this.update(ops[i], val[i], SKIP);
  }
  return this;
};
