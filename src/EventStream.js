import UniqueList from './util/UniqueList';
import {array, Empty} from './util/Arrays';
import {True, Identity} from './util/Functions';

var STREAM_ID = 0;

/**
 * Models an event stream.
 * @constructor
 * @param {function(Object, number): boolean} [filter] - Filter predicate.
 *   Events pass through when truthy, events are suppressed when falsy.
 * @param {function(Object): *} [apply] - Applied to input events to produce
 *   new event values.
 * @param {function(Object)} [receive] - Event callback function to invoke
 *   upon receipt of a new event. Use to override standard event processing.
 */
function EventStream(filter, apply, receive) {
  this.id = ++STREAM_ID;
  this.value = null;
  if (receive) this.receive = receive;
  if (filter) this._filter = filter;
  if (apply) this._apply = apply;
}

var prototype = EventStream.prototype;

prototype._filter = True;

prototype._apply = Identity;

prototype.targets = function() {
  return this._targets || (this._targets = UniqueList());
};

prototype.receive = function(evt) {
  if (this._filter(evt)) {
    var val = (this.value = this._apply(evt));
    (this._targets || Empty).forEach(function(t) { t.receive(val); });
    evt.preventDefault();
    evt.stopPropagation();
  }
};

prototype.filter = function(filter) {
  var s = stream(filter);
  return (this.targets().add(s), s);
};

prototype.apply = function(apply) {
  var s = stream(null, apply);
  return (this.targets().add(s), s);
};

prototype.merge = function() {
  var s = stream();

  this.targets().add(s);
  for (var i=0, n=arguments.length; i<n; ++i) {
    arguments[i].targets().add(s);
  }

  return s;
};

prototype.throttle = function(pause) {
  var t = -1;
  return this.filter(function() {
    var now = Date.now();
    return (now - t) > pause ? (t = now, 1) : 0;
  });
};

prototype.debounce = function(delay) {
  var s = stream(), evt = null, tid = null;

  function callback() {
    s.receive(evt); evt = null; tid = null;
  }

  this.targets().add(stream(null, null, function(e) {
    evt = e;
    if (tid) clearTimeout(tid);
    tid = setTimeout(callback, delay);
  }));

  return s;
};

prototype.between = function(a, b) {
  var active = false;
  a.targets().add(stream(null, null, function() { active = true; }));
  b.targets().add(stream(null, null, function() { active = false; }));
  return this.filter(function() { return active; });
};

/**
 * Creates a new event stream instance with the provided
 * (optional) filter, apply and receive functions.
 * @param {function(Object, number): boolean} [filter] - Filter predicate.
 *   Events pass through when truthy, events are suppressed when falsy.
 * @param {function(Object): *} [apply] - Applied to input events to produce
 *   new event values.
 * @see EventStream
 */
export function stream(filter, apply, receive) {
  return new EventStream(filter, apply, receive);
}

/**
 * Creates a new event stream that monitors an event source.
 * @param {string|Object|Object[]} source - The event source. Can be a CSS
 *   selector string, an object that supports 'addEventListener', or an array
 *   of such objects. For CSS selectors, document.querySelectorAll is applied.
 * @param {string} type - A string indicating the type of event to listen to.
 * @param {function(Object, number): boolean} [filter] - Filter predicate.
 *   Events pass through when truthy, events are suppressed when falsy.
 * @param {function(Object): *} [apply] - Applied to input events to produce
 *   new event values.
 * @see EventStream
 */
export function events(source, type, filter, apply) {
  var s = stream(filter, apply),
      send = function(e) { s.receive(e); },
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
