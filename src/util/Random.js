export function normal(mean, stdev) {
  var next = null;
  return function() {
    var x = 0, y = 0, rds, c;
    if (next != null) { x = next; next = null; return x; }
    do {
      x = Math.random()*2-1;
      y = Math.random()*2-1;
      rds = x*x + y*y;
    } while (rds === 0 || rds > 1);
    c = Math.sqrt(-2*Math.log(rds)/rds); // Box-Muller transform
    next = mean + y*c*stdev;
    return mean + x*c*stdev;
  };
}
