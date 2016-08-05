var tape = require('tape'),
    vega = require('../../'),
    changeset = vega.changeset,
    Collect = vega.transforms.Collect,
    CountIndex = vega.transforms.CountIndex;

tape('CountIndex maintains an index of counts', function(test) {
  var data = [
    {'id': 1, 'value': 'foo'},
    {'id': 2, 'value': 'foo'},
    {'id': 3, 'value': 'bar'},
    {'id': 4, 'value': 'foo'},
    {'id': 5, 'value': 'baz'}
  ];

  var id = vega.field('id'),
      va = vega.field('value'),
      df = new vega.Dataflow(),
      c0 = df.add(Collect),
      fi = df.add(null), // populate with field accessor later
      ci = df.add(CountIndex, {field:fi, pulse:c0}),
      map;

  df.update(fi, va).run(); // inicialize

  // add data
  df.pulse(c0, changeset().insert(data)).run();
  map = ci.value;
  test.equal(map.size(), 3);
  test.equal(map.get('foo'), 3);
  test.equal(map.get('bar'), 1);
  test.equal(map.get('baz'), 1);
  test.equal(map.get('boo'), undefined);
  test.equal(ci.modified(), true);

  // change key field value
  df.pulse(c0, changeset().modify(data[0], 'value', 'bar')).run();
  map = ci.value;
  test.equal(map.size(), 3);
  test.equal(map.get('foo'), 2);
  test.equal(map.get('bar'), 2);
  test.equal(map.get('baz'), 1);
  test.equal(map.get('boo'), undefined);
  test.equal(ci.modified(), true);

  // change non-key field value
  df.pulse(c0, changeset().modify(data[1], 'id', 1)).run();
  map = ci.value;
  test.equal(map.size(), 3);
  test.equal(map.get('foo'), 2);
  test.equal(map.get('bar'), 2);
  test.equal(map.get('baz'), 1);
  test.equal(map.get('boo'), undefined);
  test.equal(ci.modified(), false);

  // do nothing
  df.touch(c0).touch(ci).run();
  map = ci.value;
  test.equal(map.size(), 3);
  test.equal(ci.modified(), false);

  // change field being indexed
  df.update(fi, id).run();
  map = ci.value;
  test.equal(map.size(), 4);
  test.equal(map.get(1), 2);
  test.equal(map.get(2), undefined);
  test.equal(map.get(3), 1);
  test.equal(map.get(4), 1);
  test.equal(map.get(5), 1);
  test.equal(ci.modified(), true);

  // remove data
  df.pulse(c0, changeset().remove(data[2])).run();
  test.equal(map.size(), 3);
  test.equal(map.get(1), 2);
  test.equal(map.get(2), undefined);
  test.equal(map.get(3), undefined);
  test.equal(map.get(4), 1);
  test.equal(map.get(5), 1);
  test.equal(ci.modified(), true);

  test.end();
});
