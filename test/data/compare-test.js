var tape = require('tape'),
    dataflow = require('../../');

tape('Compare generates comparator functions', function(test) {
  var df = new dataflow.Dataflow(),
      c = df.add('foo'),
      o = df.add('ascending'),
      f = df.add(dataflow.Compare, {fields:c, orders:o});

  df.run();
  test.equal(typeof f.value, 'function');
  test.deepEqual(f.value.fields, ['foo']);

  df.update(o, 'descending').run();
  test.equal(typeof f.value, 'function');
  test.deepEqual(f.value.fields, ['foo']);

  df.update(c, 'bar').run();
  test.equal(typeof f.value, 'function');
  test.deepEqual(f.value.fields, ['bar']);

  df.update(c, ['foo', 'bar'])
    .update(o, ['descending', 'descending'])
    .run();
  test.equal(typeof f.value, 'function');
  test.deepEqual(f.value.fields, ['foo', 'bar']);

  test.end();
});
