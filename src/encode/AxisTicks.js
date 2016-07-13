import Transform from '../Transform';
import {inherits} from '../util/Functions';
import {ingest} from '../Tuple';

import {
  format as numberFormat,
  formatSpecifier
} from 'd3-format';

/**
 * Generates axis ticks for visualizing a spatial scale.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Scale} params.scale - The scale to generate ticks for.
 * @param {*} [params.count=10] - The approximate number of ticks, or
 *   desired tick interval, to use.
 * @param {Array<*>} [params.values] - The exact tick values to use.
 *   These must be legal domain values for the provided scale.
 *   If provided, the count argument is ignored.
 * @param {function(*):string} [params.formatSpecifier] - A format specifier
 *   to use in conjunction with scale.tickFormat.  Legal values are
 *   any valid d3 4.0 format specifier or the special 'auto' value for
 *   automatic formatting of variable-precision numbers.
 * @param {function(*):string} [params.format] - The format function to use.
 *   If provided, the formatSpecifier argument is ignored.
 */
export default function AxisTicks(params) {
  Transform.call(this, [], params);
}

var prototype = inherits(AxisTicks, Transform);

prototype.transform = function(_, pulse) {
  if (this.value != null && !_.modified()) {
    return pulse.StopPropagation;
  }

  var out = pulse.fork(),
      ticks = this.value,
      scale = _.scale,
      count = _.count == null ? 10 : _.count,
      format = tickFormat(_, scale, count),
      values = tickValues(_, scale, count).map(function(v) {
        return ingest({value: v, label: format(v)})
      });

  if (ticks) out.rem = ticks;
  return (out.source = out.add = this.value = values), out;
};

function tickValues(_, scale, count) {
  return _.values || (scale.ticks
    ? scale.ticks(count)
    : scale.domain());
}

function tickFormat(_, scale, count) {
  var format = _.format;

  if (!format) {
    var spec = _.formatSpecifier,
        auto = spec === 'auto',
        log = scale.type === 'log';

    if (auto || log && !spec) {
      spec = auto ? null : spec;
      format = autoFormat(spec);
      if (log) format = filter(format, scale, count, spec);
    } else {
      format = scale.tickFormat ? scale.tickFormat(count, spec) : String;
    }
  }

  return format;
}

// -- AUTO-FORMAT UTILITIES -----

function filter(format, scale, count, spec) {
  var f = scale.tickFormat(count, spec);
  return function(_) { return f(_) ? format(_) : ''; };
}

function autoFormat(spec) {
  var decimal = numberFormat('.1f')(1)[1]; // get decimal char
  if (spec == null) spec = ',';
  spec = formatSpecifier(spec);
  if (spec.precision == null) spec.precision = 12;
  switch (spec.type) {
    case '%': spec.precision -= 2; break;
    case 'e': spec.precision -= 1; break;
  }
  return trimZero(numberFormat(spec), decimal);
}

function trimZero(format, decimal) {
  return function(x) {
    var s = format(x),
        n = s.indexOf(decimal);
    if (n < 0) return s;

    var idx = rightmostDigit(s, n),
        end = idx < s.length ? s.slice(idx) : '';

    while (--idx > n) {
      if (s[idx] !== '0') { ++idx; break; }
    }
    return s.slice(0, idx) + end;
  };
}

function rightmostDigit(s, n) {
  var i = s.lastIndexOf('e'), c;
  if (i > 0) return i;
  for (i=s.length; --i > n;) {
    c = s.charCodeAt(i);
    if (c >= 48 && c <= 57) return i+1; // is digit
  }
}
