// EVENT ACCESSORS

function option(_, e) {
  return e.target.options[e.target.selectedIndex].value;
}

function check(_, e) { return e.target.checked; }

function value(_, e) { return +e.target.value; }

function text(_, e) { return e.target.value || null; }

function datum(_, e) { return e.target.datum; }

function pageX(_, e) { return e.pageX; }

function pageY(_, e) { return e.pageY; }

// UTILITY METHODS

function changes(_, e) {
  var cs = vega.changeset();
  if (_.add && _.add[0]) cs.insert(_.add);
  if (_.rem && _.rem[0]) cs.remove(_.rem);
  return cs;
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(v, min));
}

function range(_) {
  var a = clamp(Math.min(_.x[0], _.x[1]), 0, 500),
      b = clamp(Math.max(_.x[0], _.x[1]), 0, 500);
  return [(a/5), (b/5)];
}

function setX(_, e) {
  var x = clamp(e.pageX - 10, 0, 500);
  return [x, x];
}

function dragX(_, e) {
  return [_.x[0], e.pageX - 10];
}

function panX(_, e) {
  var dx = e.pageX - _.xdown;
  return [_.x[0] + dx, _.x[1] + dx];
}

function maxX() { return [0, 500]; }

function zoomX(_, e) {
  var s = Math.pow(1.0005, e.deltaY * Math.pow(16, e.deltaMode)),
      cx = (_.x[0] + _.x[1]) / 2,
      dx = s * Math.abs(_.x[1] - _.x[0]) / 2;
  return [cx-dx, cx+dx];
}

function interactors(df, source) {
  var el = source || window;

  // EVENT STREAMS
  var mousemove = df.events(el, 'mousemove'),
      mousedown = df.events(el, 'mousedown'),
      mouseup = df.events(el, 'mouseup'),
      wheel = df.events(el, 'wheel').consume(true),
      dblclick = df.events(el, 'dblclick').consume(true);

  // BRUSH HANDLER
  function brush(el, f, x, xd) {
    function drag(a) { return mousemove.between(a, mouseup); }
    function filter(s) { return f ? s.filter(f) : s; }

    var bdown = df.events(el, 'mousedown').consume(true),
        vdown = filter(mousedown);

    df.on(vdown, x, setX)                        // set extent on mouse down
      .on(drag(vdown), x, dragX, {x:x})          // drag out brush extent
      .on(drag(bdown), x, panX, {x:x, xdown:xd}) // pan brush
      .on(filter(dblclick), x, maxX)            // maximize on double click
      .on(filter(wheel), x, zoomX, {x:x});      // zoom on scroll wheel
  }

  return {
    mousemove: mousemove,
    mousedown: mousedown,
    mouseup:   mouseup,
    wheel:     wheel,
    dblclick:  dblclick,
    brush:     brush
  };
}
