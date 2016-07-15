var tape = require('tape'),
    vega = require('../../');

tape('Field generates field accessors', function(test) {
  var df = new vega.Dataflow(),
      n = df.add('foo'),
      a = df.add(null),
      f = df.add(vega.Field, {name:n, as:a});

  df.run();
  test.equal(typeof f.value, 'function');
  test.equal(vega.accessorName(f.value), 'foo');
  test.deepEqual(vega.accessorFields(f.value), ['foo']);

  df.update(n, 'bar').run();
  test.equal(typeof f.value, 'function');
  test.equal(vega.accessorName(f.value), 'bar');
  test.deepEqual(vega.accessorFields(f.value), ['bar']);

  df.update(a, 'baz').run();
  test.equal(typeof f.value, 'function');
  test.equal(vega.accessorName(f.value), 'baz');
  test.deepEqual(vega.accessorFields(f.value), ['bar']);

  df.update(n, ['foo', 'bar']).run();
  test.equal(Array.isArray(f.value), true);
  test.deepEqual(f.value.map(vega.accessorName), ['foo', 'bar']);
  test.deepEqual(
    f.value.map(vega.accessorFields),
    [['foo'], ['bar']]);

  test.end();
});
