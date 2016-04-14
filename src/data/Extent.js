import Transform from './Transform';

// Computes extents (min/max) for a data field.
// The 'field' parameter indicates the field to process.
export default function Extent(args) {
  Transform.call(this, null, args);
}

var prototype = (Extent.prototype = Object.create(Transform.prototype));
prototype.constructor = Extent;

prototype._transform = function(_, pulse) {
  var extent = this.value,
      field = _.field,
      data, mod, min, max, i=0, v;

  mod = pulse.rem.length
     || pulse.mod.length
     || pulse.modified(field)
     || _.modified('field');

  data = mod ? pulse.reflow(true) : pulse.add;

  if (!data.length) {
    this.value = null;
    return;
  } else if (mod || !extent) {
    min = max = data[i++][field];
  } else {
    min = extent[0];
    max = extent[1];
  }

  for (; i<data.length; ++i) {
    v = data[i][field];
    if (v < min) min = v;
    if (v > max) max = v;
  }

  this.value = [min, max];
};
