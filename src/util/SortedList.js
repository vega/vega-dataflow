import {idFilter} from '../Tuple';

// Maintains a list of objects, sorted by provided keys
// Current assumptions:
// - Contained objects have a unique '_id' field
// - Only unique objects are added/removed
export default function SortedList() {
  this.clear();
}

function compare(a, b) {
  return a.k < b.k ? -1 : a.k > b.k ? 1 : 0;
}

var prototype = SortedList.prototype;

prototype.clear = function() {
  this._list = [];
  this._rem = [];
  this._dirty = false;
};

prototype.size = function() {
  return (this._list.length - this._rem.length);
};

prototype.insert = function(key, value) {
  this._list.push({k:key, v:value, _id:value._id});
  this._dirty = true;
};

prototype.remove = function(value) {
  this._rem.push(value);
  this._dirty = true;
};

prototype.balance = function() {
  this.flush();
  this._dirty = false;
  this._list.sort(compare);
  return this;
};

prototype.flush = function() {
  if (this._rem.length) {
    this._list = idFilter(this._list, this._rem);
    this._rem = [];
  }
};

prototype.bisectLeft = function(key) {
  if (this._dirty) this.balance();
  var list = this._list;
  return bisectLeft(list, {k:key}, 0, list.length);
};

prototype.bisectRight = function(key) {
  if (this._dirty) this.balance();
  var list = this._list;
  return bisectRight(list, {k:key}, 0, list.length);
};

prototype.visit = function(a, b, visitor) {
  var list = this._list;
  for (var i=a; i<b; ++i) {
    visitor(list[i].v);
  }
};

prototype.query = function(range, visitor) {
  if (this._dirty) this.balance();
  var list = this._list,
      N = list.length,
      a = bisectLeft(list, {k:range[0]}, 0, N),
      b = bisectRight(list, {k:range[1]}, 0, N);
  this.visit(a, b, visitor);
};

// TODO refactor binary search methods to utilities
function bisectLeft(a, x, lo, hi) {
  if (arguments.length < 3) lo = 0;
  if (arguments.length < 4) hi = a.length;
  while (lo < hi) {
    var mid = lo + hi >>> 1;
    if (compare(a[mid], x) < 0) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
function bisectRight(a, x, lo, hi) {
  if (arguments.length < 3) lo = 0;
  if (arguments.length < 4) hi = a.length;
  while (lo < hi) {
    var mid = lo + hi >>> 1;
    if (compare(a[mid], x) > 0) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}
