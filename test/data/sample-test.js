var tape = require('tape'),
    dataflow = require('../../'),
    ingest = dataflow.Tuple.ingest;

tape('Sample samples tuples', function(test) {
  var n = 100,
      ns = 20,
      data = Array(n),
      map = {},
      i, t;

  for (i=0; i<n; ++i) {
    data[i] = ingest({v:Math.random()});
  }

  var df = new dataflow.Dataflow(),
      s = df.add(dataflow.Sample, {num: ns});

  // -- initial sample
  df.nextPulse.add = data;
  df.run();
  test.equal(s.value.length, ns);
  test.notDeepEqual(s.value.length, data.slice(0, ns));

  // -- modify tuple in and out sample, check propagation
  s.value.forEach(function(t) { map[t._id] = 1; });
  var inTuple = s.value[0];
  var outTuple = null;

  for (i=0; i<n; ++i) {
    t = data[i];
    if (!map[t._id]) { outTuple = t; break; }
  }

  inTuple.v = outTuple.v = -1;
  df.nextPulse.mod = [inTuple, outTuple];
  df.touch(s).run();
  test.equal(s.value.length, ns);
  test.deepEqual(s.pulse.mod, [inTuple]);

  // -- remove half of sample, no backing source
  map = {};
  var rems = s.value.slice(0, 10);
  rems.forEach(function(t) { map[t._id] = 1; });
  df.nextPulse.rem = rems;
  df.touch(s).run();
  test.equal(s.value.length, ns - 10);
  test.false(s.value.some(function(t) { return map[t._id]; }));

  // -- remove half of sample, with backing source
  df.nextPulse.rem = s.value;
  df.nextPulse.source = data;
  df.touch(s).run();
  test.equal(s.value.length, ns);

  test.end();
});
