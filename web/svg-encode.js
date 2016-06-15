// TEST SUPPORT FOR VISUAL ENCODERS USING SVG
// This should be superseded in the future by parser infrastructure.

function svgSetter(obj, key, value) {
  return obj + '.setAttribute("' + key + '",' + value + ');';
}

function parse(encoding, footer) {
  return parseEncoder(encoding, svgSetter, footer);
}

function Encoder(encoders, scope, pulse) {
  var params = {encoders:encoders, pulse:pulse},
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

  return new vega.Encode(params);
}

function items(el, tag) {
  return function() {
    var x = document.createElementNS('http://www.w3.org/2000/svg', tag);
    return (x.parent = el, el.appendChild(x), x);
  }
}

function arc(sa, ea, i, o, x, y) {
  x = x || 0;
  y = y || 0;

  var a = sa - Math.PI/2,
      b = ea - Math.PI/2,
      f = (b > a) ? 1 : 0,
      p = '',
      d = Math.abs(b-a),
      l = d > Math.PI ? 1 : 0,
      ca = Math.cos(a), sa = Math.sin(a),
      cb = Math.cos(b), sb = Math.sin(b),
      cmd = 'L'

  if (i === 0) {
    if (d >= 6.28) {
      cmd = 'M';
    } else {
      p = 'M' + x + ',' + y;
    }
  } else {
    p = 'M' + (x + i*cb) + ',' + (y + i*sb)
      + 'A' + i + ' ' + i + ' 0 ' + l + ' ' + (f?0:1) + ' '
      + (x + i*ca) + ',' + (y + i*sa);
    if (d >= 6.28) cmd = 'M';
  }
  return p
    + cmd + (x + o*ca) + ',' + (y + o*sa)
    + 'A' + o + ' ' + o + ' 0 ' + l + ' ' + f + ' '
    + (x + o*cb) + ',' + (y + o*sb)
    + 'Z';
}

function isObject(_) {
  return _ === Object(_);
}

function isString(_) {
  return typeof _ === 'string';
}

function stringValue(x) {
  return Array.isArray(x) ? '[' + x.map(stringValue) + ']'
    : isObject(x) || isString(x) ?
      // Output valid JSON and JS source strings.
      // See http://timelessrepo.com/json-isnt-a-javascript-subset
      JSON.stringify(x).replace('\u2028','\\u2028').replace('\u2029', '\\u2029')
    : x;
}

var parseEncoder = (function() {
  var UniqueList = vega.UniqueList;

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
