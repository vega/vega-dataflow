import Transform from './Transform';
import {ingest, prev_init, set} from '../Tuple';

// Count regexp-defined pattern occurrences in a text field.
// The 'field' parameter is an accessor for the text field to process.
// The 'pattern' parameter is a regexp string defining patterns.
// The 'case' parameter indicates 'lower', 'upper' or null text case.
// The 'stopwords' parameter is a regexp string indicating what to ignore.
// The 'source' parameter references a collector data source.
export default function CountPattern(params) {
  Transform.call(this, null, params);
}

function tokenize(text, tcase, match) {
  switch (tcase) {
    case 'upper': text = text.toUpperCase(); break;
    case 'lower': text = text.toLowerCase(); break;
  }
  return text.match(match);
}

var prototype = (CountPattern.prototype = Object.create(Transform.prototype));
prototype.constructor = CountPattern;

prototype._transform = function(_, pulse) {
  function process(update) {
    return function(tuple) {
      var tokens = tokenize(get(tuple), _.case, match) || [], t;
      for (var i=0, n=tokens.length; i<n; ++i) {
        if (!stop.test(t = tokens[i])) update(t);
      }
    };
  }

  var init = this._parameterCheck(_, pulse),
      counts = this._counts,
      match = this._match,
      stop = this._stop,
      get = _.field,
      add = process(function(t) { counts[t] = 1 + (counts[t] || 0); }),
      rem = process(function(t) { counts[t] -= 1; });

  if (init) {
    pulse.visit(pulse.SOURCE, add);
  } else {
    pulse.visit(pulse.ADD, add);
    pulse.visit(pulse.REM, rem);
  }

  return this._finish(pulse); // generate output tuples
};

prototype._parameterCheck = function(_, pulse) {
  var init = false;

  if (_.modified('stopwords') || !this._stop) {
    this._stop = new RegExp('^' + (_.stopwords || '') + '$', 'i');
    init = true;
  }

  if (_.modified('pattern') || !this._match) {
    this._match = new RegExp((_.pattern || '[\\w\']+'), 'g');
    init = true;
  }

  if (_.modified('field') || pulse.modified(_.field.fields)) {
    init = true;
  }

  if (init) this._counts = {};
  return init;
}

prototype._finish = function(pulse) {
  var counts = this._counts,
      tuples = this._tuples || (this._tuples = {}),
      stamp = pulse.stamp,
      out = pulse.fork(),
      w, t, c;

  for (w in counts) {
    t = tuples[w];
    c = counts[w] || 0;
    if (!t && c) {
      tuples[w] = (t = ingest({text: w, count: c}));
      out.add.push(t);
    } else if (c === 0) {
      if (t) out.rem.push(t);
      counts[w] = null;
      tuples[w] = null;
    } else if (t.count !== c) {
      prev_init(t, stamp);
      set(t, 'count', c);
      out.mod.push(t);
    }
  }

  return out.modifies(['text', 'count']);
};
