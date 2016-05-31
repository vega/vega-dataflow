var tape = require('tape'),
    dataflow = require('../../');

tape('Lookup looks up matching tuples', function(test) {
  var lut = [
    {'id': 1, 'value': 'foo'},
    {'id': 3, 'value': 'bar'},
    {'id': 5, 'value': 'baz'},
  ].map(dataflow.Tuple.ingest);

  var data = [
    {'id': 0, 'x': 5, 'y': 1},
    {'id': 1, 'x': 3, 'y': 5},
    {'id': 2, 'x': 1, 'y': 5},
    {'id': 3, 'x': 3, 'y': 3}
  ].map(dataflow.Tuple.ingest);

  var uv = function(t) { return t.u.value; }, // field('u.value')
      vv = function(t) { return t.v.value; }, // field('v.value')
      id = dataflow.field('id'),
      x = dataflow.field('x'),
      y = dataflow.field('y'),
      df = new dataflow.Dataflow(),
      c0 = df.add(dataflow.Collect),
      hi = df.add(dataflow.HashIndex, {field:id, pulse:c0}),
      c1 = df.add(dataflow.Collect),
      lk = df.add([x,y]),
      lu = df.add(dataflow.Lookup, {index:hi, keys:lk, as:['u','v'], pulse:c1});

  df.run(); // initialize

  // add lookup table
  df.nextPulse.add = lut;
  df.touch(c0).run();
  test.equal(Object.keys(hi.value).length, 3);

  // add primary data
  df.nextPulse.add = data;
  df.touch(c1).run();
  var p = lu.pulse.add;
  test.equal(p.length, 4);
  test.deepEqual(p.map(uv), ['baz', 'bar', 'foo', 'bar']);
  test.deepEqual(p.map(vv), ['foo', 'baz', 'baz', 'bar']);

  // swap lookup keys
  df.update(lk, [y,x]).run();
  p = lu.pulse.mod;
  test.equal(p.length, 4);
  test.deepEqual(p.map(vv), ['baz', 'bar', 'foo', 'bar']);
  test.deepEqual(p.map(uv), ['foo', 'baz', 'baz', 'bar']);

  test.end();
});
