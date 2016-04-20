// Hash that tracks modifications to assigned values
// Callers *must* use the set method to update values
export default function ModMap() {
  this.__mod__ = {};
}

var prototype = ModMap.prototype;

prototype.set = function(key, value) {
  var o = this,
      mod = o.__mod__;
  if (o[key] !== value) {
    o[key] = value;
    mod[key] = 1;
  }
};

prototype.modified = function(key) {
  var mod = this.__mod__;
  if (!arguments.length) {
    for (var name in mod) { if (mod[name]) return 1; }
    return 0;
  }
  return mod[key];
};

prototype.clear = function() {
  this.__mod__ = {};
};
