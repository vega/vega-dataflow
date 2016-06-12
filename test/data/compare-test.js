var tape = require('tape'),
    dataflow = require('../../');

tape('Compare generates comparator functions', function(test) {
  var df = new dataflow.Dataflow(),
      c = df.add('-foo'),
      f = df.add(dataflow.Compare, {fields:c});

  df.run();
  test.equal(typeof f.value, 'function');
  test.deepEqual(f.value.fields, ['foo']);

  df.update(c, '+bar').run();
  test.equal(typeof f.value, 'function');
  test.deepEqual(f.value.fields, ['bar']);

  test.end();
});

tape('Compare generates comparator functions', function(test) {
  var df = new dataflow.Dataflow(),
      a = df.add('mean'),
      c = df.add('foo'),
      o = df.add('descending'),
      f = df.add(dataflow.Compare, {op:a, field:c, order:o});

  df.run();
  test.equal(typeof f.value, 'function');
  test.deepEqual(f.value.fields, ['mean_foo']);

  df.update(c, 'bar').run();
  test.equal(typeof f.value, 'function');
  test.deepEqual(f.value.fields, ['mean_bar']);

  df.update(a, 'count').run();
  test.equal(typeof f.value, 'function');
  test.deepEqual(f.value.fields, ['count_bar']);

  df.update(c, null).run();
  test.equal(typeof f.value, 'function');
  test.deepEqual(f.value.fields, ['count']);

  df.update(o, null).run();
  test.equal(typeof f.value, 'function');
  test.deepEqual(f.value.fields, ['count']);

  test.end();
});
