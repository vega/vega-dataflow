import {indexarray} from './Arrays';

export default function Bitmaps() {

  var width = 8,
      curr = indexarray(0, width),
      prev = indexarray(0, width);

  return {
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
    },

    update: function(n, reindex) {
      if (!(reindex && reindex.length)) return;
      var fn = curr.length,
          i = 0, k;

      for (; reindex[i] === i; ++i);
      for (; i<n; ++i) {
        k = reindex[i];
        curr[i] = curr[k];
        prev[i] = prev[k]; // ? DROP
      }
      for (; i<fn; ++i) {
        curr[i] = 0;
        prev[i] = 0; // ? DROP
      }
    }
  };
}
