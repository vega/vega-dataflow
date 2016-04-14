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
  return this.__mod__[key];
};

prototype.clear = function() {
  this.__mod__ = {};
};
