var tape = require('tape'),
    dataflow = require('../../');

tape("Rank ranks tuples", function(test) {
  var data = [
    {"x": 0, "y": 28}, {"x": 1, "y": 43},
    {"x": 0, "y": 55}, {"x": 1, "y": 72}
  ].map(dataflow.Tuple.ingest);

  var rank = dataflow.field('rank'),
      x = dataflow.field('x'),
      df = new dataflow.Dataflow(),
      m = df.add('value'),
      f = df.add(null),
      n = df.add(false),
      c = df.add(dataflow.Collect),
      r = df.add(dataflow.Rank, {field:f, normalize:n, pulse:c});

  df.nextPulse.add = data;

  df.run();
  test.deepEqual(c.value.map(rank), [0, 1, 2, 3]);

  df.update(n, true).run();
  test.deepEqual(c.value.map(rank), [0, 1/3, 2/3, 1]);

  df.update(n, false).update(f, x).run();
  test.deepEqual(c.value.map(rank), [0, 1, 0, 1]);

  df.update(n, true).run();
  test.deepEqual(c.value.map(rank), [0, 1, 0, 1]);

  test.end();
});
