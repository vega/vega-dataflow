import UniqueList from './util/UniqueList';
import {array} from './util/Arrays';
import {True, Identity} from './util/Functions';

var STREAM_ID = 0;

export function stream(filter, apply) {
  return new Stream(filter, apply);
}

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

function Stream(filter, apply) {
  this.id = ++STREAM_ID;
  this.value = null;
  this.targets = UniqueList();
  if (filter) this._filter = filter;
  if (apply) this._apply = apply;
}

var prototype = Stream.prototype;
prototype._filter = True;
prototype._apply = Identity;

prototype.receive = function(evt) {
  if (this._filter(evt)) {
    var val = (this.value = this._apply(evt));
    this.targets.forEach(function(t) { t.receive(val); });
    evt.preventDefault();
    evt.stopPropagation();
  }
};

prototype.filter = function(filter) {
  var s = stream(filter);
  return (this.targets.add(s), s);
};

prototype.apply = function(apply) {
  var s = stream(null, apply);
  return (this.targets.add(s), s);
};

prototype.merge = function() {
  var s = stream();

  this.targets.add(s);
  for (var i=0, n=arguments.length; i<n; ++i) {
    arguments[i].targets.add(s);
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

  this.targets.add({
    id: ++STREAM_ID,
    receive: function(e) {
      evt = e;
      if (tid) clearTimeout(tid);
      tid = setTimeout(callback, delay);
    }
  });

  return s;
};

prototype.between = function(a, b) {
  var active = false;
  a.targets.add({id: ++STREAM_ID, receive: function() { active = true; }});
  b.targets.add({id: ++STREAM_ID, receive: function() { active = false; }});
  return this.filter(function() { return active; });
};
