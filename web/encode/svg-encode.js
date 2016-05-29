// TEST SUPPORT FOR VISUAL ENCODERS USING SVG
// This should be superseded in the future by parser infrastructure.

function svgSetter(obj, key, value) {
  return obj + '.setAttribute("' + key + '",' + value + ');';
}

function parse(encoding, footer) {
  return parseEncoder(encoding, svgSetter, footer);
}

function Encoder(encoders, scope, pulse) {
  var params = {pulse:pulse},
      name, fn, deps;

  // marshall dependencies into parameter signature
  for (name in encoders) {
    fn = encoders[name];
    fn.deps.scales.forEach(function(s) { params[s] = scope.scales[s]; });
    fn.deps.signals.forEach(function(s) { params[s] = scope.signals[s]; });
  }
  if (scope.parent) {
    params.parent = scope.parent;
  }

  return new dataflow.Encode(encoders, params);
}

function items(el, tag) {
  return function() {
    var x = document.createElementNS('http://www.w3.org/2000/svg', tag);
    return (x.parent = el, el.appendChild(x), x);
  }
}

var parseEncoder = (function() {
  var UniqueList = dataflow.UniqueList,
      isString = dataflow.isString,
      stringValue = dataflow.stringValue;

  function parseEncoder(encodings, setter, footer) {
    var deps = new Dependencies(),
        set = setter || objectSetter,
        code, k, v, c, fn;

    code = 'var o=item,t=o.datum;'

    for (k in encodings) {
      v = encodings[k];
      c = parseEntry(k, v, deps);
      code += set('o', k, c);
    }

    if (footer != null) code += footer;
    code += 'return true;'; // TODO change tracking

    fn = Function('item', '_', code);
    fn.code = code;
    fn.deps = deps;
    fn.fields = deps.fields.slice();
    return fn;
  }

  function objectSetter(obj, key, value) {
    return obj + '["' + key + '"] = ' + value + ';';
  }

  function parseEntry(channel, enc, deps) {
    var value , scale;

    value = (enc.field != null) ? deps.field(enc.field)
      : (enc.signal != null) ? deps.signal(enc.signal)
      : (enc.value != null) ? stringValue(enc.value)
      : null;

    if (enc.scale != null) {
      scale = deps.scale(enc.scale);

      // run through scale function if value is specified.
      if (value != null || enc.band) {
        value = scale + (enc.band
          ? '.bandwidth()'
          : '(' + (value != null ? value : 't.value') + ')');
      }
    }

    return value;
  }

  // --  Dependency Management -----

  function Dependencies() {
    this.signals = UniqueList();
    this.scales = UniqueList();
    this.fields = UniqueList();
    // this.data = UniqueList(Identity); // TODO: add data deps
  }

  var prototype = Dependencies.prototype;

  prototype.signal = function(name) {
    this.signals.add(name);
    return '_["' + name + '"]';
  };

  prototype.scale = function(name) {
    this.scales.add(name);
    return '_["' + name + '"]';
  };

  prototype.field = function(name) {
    if (!isString(name)) {
      this.fields.add(name.parent);
      return 'item.parent.datum["' + name.parent + '"]';
    }
    this.fields.add(name);
    return 't["' + name + '"]';
  };

  return parseEncoder;
})();
