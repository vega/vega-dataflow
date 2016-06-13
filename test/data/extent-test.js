var tape = require('tape'),
    dataflow = require('../../'),
    changeset = dataflow.changeset;

tape('Extent computes extents', function(test) {
  var data = [
    {"x": 0, "y": 28}, {"x": 1, "y": 43},
    {"x": 0, "y": 55}, {"x": 1, "y": 72}
  ];

  var x = dataflow.field('x'),
      y = dataflow.field('y'),
      df = new dataflow.Dataflow(),
      f = df.add(null),
      c = df.add(dataflow.Collect),
      a = df.add(dataflow.Extent, {field:f, pulse:c}),
      b = df.add(dataflow.Extent, {field:y, pulse:c});

  df.update(f, x)
    .pulse(c, changeset().insert(data))
    .run();
  test.deepEqual(a.value, [0, 1]);
  test.deepEqual(b.value, [28, 72]);

  df.update(f, y).run();
  test.deepEqual(a.value, [28, 72]);
  test.deepEqual(b.value, [28, 72]);

  test.end();
});
