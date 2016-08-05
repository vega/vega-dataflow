var tape = require('tape'),
    vega = require('../../'),
    changeset = vega.changeset,
    Collect = vega.transforms.Collect,
    Extent = vega.transforms.Extent;

tape('Extent computes extents', function(test) {
  var data = [
    {"x": 0, "y": 28}, {"x": 1, "y": 43},
    {"x": 0, "y": 55}, {"x": 1, "y": 72}
  ];

  var x = vega.field('x'),
      y = vega.field('y'),
      df = new vega.Dataflow(),
      f = df.add(null),
      c = df.add(Collect),
      a = df.add(Extent, {field:f, pulse:c}),
      b = df.add(Extent, {field:y, pulse:c});

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
