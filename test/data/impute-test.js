var tape = require('tape'),
    dataflow = require('../../'),
    changeset = dataflow.changeset;

tape('Impute imputes missing tuples', function(test) {
  var data = [
    {'x': 0, 'y': 28, 'c':0}, {'x': 0, 'y': 55, 'c':1},
    {'x': 1, 'y': 43, 'c':0}
  ];

  var x = dataflow.field('x'),
      y = dataflow.field('y'),
      c = dataflow.field('c'),
      df = new dataflow.Dataflow(),
      m  = df.add('value'),
      co = df.add(dataflow.Collect),
      im = df.add(dataflow.Impute, {field:y, method:m, value:-1, groupby:[c], orderby:[x], pulse:co}),
      p;

  df.pulse(co, changeset().insert(data)).run();
  p = im.pulse;
  test.equal(p.add.length, 4);
  test.equal(p.add[3].c, 1);
  test.equal(p.add[3].x, 1);
  test.equal(p.add[3].y, -1);

  ['min', 'max', 'mean', 'median'].forEach(function(method) {
    df.update(m, method).run();
    p = im.pulse;
    test.equal(p.rem.length, 1);
    test.equal(p.add.length, 1);
    test.equal(p.add[0].c, 1);
    test.equal(p.add[0].x, 1);
    test.equal(p.add[0].y, 55);
  });

  test.end();
});
