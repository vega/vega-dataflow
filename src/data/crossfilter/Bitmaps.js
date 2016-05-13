import {indexarray, array32, arrayLengthen} from '../../util/Arrays';

/**
 * Maintains CrossFilter state.
 */
export default function Bitmaps() {

  var width = 8,
      data = [],
      seen = array32(0),
      curr = indexarray(0, width),
      prev = indexarray(0, width);

  return {

    data: function() { return data; },

    seen: function() {
      return (seen = arrayLengthen(seen, data.length));
    },

    add: function(array) {
      for (var i=0, j=data.length, n=array.length, t; i<n; ++i) {
        t = array[i];
        t._index = j++;
        data.push(t);
      }
    },

    remove: function(num, map) { // map: index -> boolean
      var n = data.length,
          copy = Array(n - num),
          reindex = data, // reuse old data array for index map
          t, i, j;

      // seek forward to first removal
      for (i=0; !map[i] && i<n; ++i) {
        copy[i] = data[i];
        reindex[i] = i;
      }

      // condense arrays
      for (j=i; i<n; ++i) {
        t = data[i];
        if (!map[i]) {
          reindex[i] = j;
          curr[j] = curr[i];
          prev[j] = prev[i];
          copy[j] = t;
          t._index = j++;
        } else {
          reindex[i] = -1;
        }
      }

      return (data = copy, reindex);
    },

    size: function() { return data.length; },

    curr: function() { return curr; },

    prev: function() { return prev; },

    reset: function(k) { prev[k] = curr[k]; },

    all: function() {
      return width < 0x101 ? 0xff : width < 0x10001 ? 0xffff : 0xffffffff;
    },

    set: function(k, one) { curr[k] |= one; },

    clear: function(k, one) { curr[k] &= ~one; },

    resize: function(n, m) {
      var i = curr.length;
      if (n >= i || m > width) {
        width = Math.max(m, width);
        curr = indexarray(n, width, curr);
        prev = indexarray(n, width);
      }
    }
  };
}
