import Transform from './Transform';

// Computes extents (min/max) for a data field.
// The 'field' parameter indicates the field to process.
export default function Extent(params) {
  Transform.call(this, [+Infinity, -Infinity], params);
}

var prototype = (Extent.prototype = Object.create(Transform.prototype));
prototype.constructor = Extent;

prototype._transform = function(_, pulse) {
  var extent = this.value,
      $ = _.field,
      min = extent[0],
      max = extent[1],
      flag = pulse.ADD,
      mod;

  mod = pulse.rem.length
     || pulse.modified($.fields)
     || _.modified('field');

  if (mod) {
    flag = pulse.SOURCE;
    min = +Infinity;
    max = -Infinity;
  }

  pulse.visit(flag, function(t) {
    var v = $(t);
    if (v < min) min = v;
    if (v > max) max = v;
  });

  this.value = [min, max];
};
