var tape = require('tape'),
    dataflow = require('../../'),
    changeset = dataflow.changeset;

tape('TupleIndex maintains an index of tuples', function(test) {
  var data = [
    {'id': 1, 'value': 'foo'},
    {'id': 3, 'value': 'bar'},
    {'id': 5, 'value': 'baz'}
  ];

  var id = dataflow.field('id'),
      va = dataflow.field('value'),
      df = new dataflow.Dataflow(),
      c0 = df.add(dataflow.Collect),
      fi = df.add(null), // populate with field accessor later
      ti = df.add(dataflow.TupleIndex, {field:fi, pulse:c0}),
      map;

  df.update(fi, id).run(); // initialize

  // add data
  df.pulse(c0, changeset().insert(data)).run();
  map = ti.value;
  test.equal(map.size(), 3);
  test.equal(map.get(1), data[0]);
  test.equal(map.get(3), data[1]);
  test.equal(map.get(5), data[2]);
  test.equal(map.get(0), undefined);
  test.equal(ti.modified(), true);

  // change key field value
  df.pulse(c0, changeset().modify(data[0], 'id', 2)).run();
  map = ti.value;
  test.equal(map.size(), 3);
  test.equal(map.get(2), data[0]);
  test.equal(map.get(3), data[1]);
  test.equal(map.get(5), data[2]);
  test.equal(map.get(1), undefined);
  test.equal(ti.modified(), true);

  // change non-key field value
  df.pulse(c0, changeset().modify(data[1], 'value', 'boo')).run();
  map = ti.value;
  test.equal(map.size(), 3);
  test.equal(map.get(2), data[0]);
  test.equal(map.get(3), data[1]);
  test.equal(map.get(5), data[2]);
  test.equal(map.get(1), undefined);
  test.equal(ti.modified(), true); // should signal changes to data

  // do nothing
  df.touch(c0).touch(ti).run();
  map = ti.value;
  test.equal(map.size(), 3);
  test.equal(ti.modified(), false);

  // change field being indexed
  df.update(fi, va).run();
  map = ti.value;
  test.equal(map.size(), 3);
  test.equal(map.get('foo'), data[0]);
  test.equal(map.get('boo'), data[1]);
  test.equal(map.get('baz'), data[2]);
  test.equal(map.get(2), undefined);
  test.equal(map.get(3), undefined);
  test.equal(map.get(5), undefined);
  test.equal(ti.modified(), true);

  // remove data
  df.pulse(c0, changeset().remove(data[1])).run();
  test.equal(map.size(), 2);
  test.equal(map.get('foo'), data[0]);
  test.equal(map.get('boo'), undefined);
  test.equal(map.get('baz'), data[2]);
  test.equal(ti.modified(), true);

  test.end();
});
