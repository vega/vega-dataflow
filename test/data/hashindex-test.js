var tape = require('tape'),
    dataflow = require('../../');

tape('HashIndex maintains a hash index', function(test) {
  var data = [
    {'id': 1, 'value': 'foo'},
    {'id': 3, 'value': 'bar'},
    {'id': 5, 'value': 'baz'}
  ].map(dataflow.Tuple.ingest);

  var id = dataflow.field('id'),
      va = dataflow.field('value'),
      df = new dataflow.Dataflow(),
      c0 = df.add(dataflow.Collect),
      fi = df.add(null), // populate with field accessor later
      hi = df.add(dataflow.HashIndex, {field:fi, pulse:c0}),
      map;

  df.update(fi, id);
  df.run(); // initialize

  // add data
  df.nextPulse.add = data;
  df.touch(c0).run();
  map = hi.value;
  test.equal(map.size(), 3);
  test.equal(map.get(1), data[0]);
  test.equal(map.get(3), data[1]);
  test.equal(map.get(5), data[2]);
  test.equal(map.get(0), undefined);
  test.equal(!!hi.modified(), true);

  // change key field value
  dataflow.Tuple.prev_init(data[0]);
  data[0].id = 2;
  df.nextPulse.modifies('id');
  df.nextPulse.mod.push(data[0]);
  df.touch(c0).run();
  map = hi.value;
  test.equal(map.size(), 3);
  test.equal(map.get(2), data[0]);
  test.equal(map.get(3), data[1]);
  test.equal(map.get(5), data[2]);
  test.equal(map.get(1), undefined);
  test.equal(!!hi.modified(), true);

  // change non-key field value
  dataflow.Tuple.prev_init(data[1]);
  data[1].value = 'boo';
  df.nextPulse.modifies('value');
  df.nextPulse.mod.push(data[1]);
  df.touch(c0).run();
  map = hi.value;
  test.equal(map.size(), 3);
  test.equal(map.get(2), data[0]);
  test.equal(map.get(3), data[1]);
  test.equal(map.get(5), data[2]);
  test.equal(map.get(1), undefined);
  test.equal(!!hi.modified(), true); // should signal changes to data

  // do nothing
  df.touch(c0).touch(hi).run();
  map = hi.value;
  test.equal(map.size(), 3);
  test.equal(!!hi.modified(), false);

  // change field being indexed
  df.update(fi, va).run();
  map = hi.value;
  test.equal(map.size(), 3);
  test.equal(map.get('foo'), data[0]);
  test.equal(map.get('boo'), data[1]);
  test.equal(map.get('baz'), data[2]);
  test.equal(map.get(2), undefined);
  test.equal(map.get(3), undefined);
  test.equal(map.get(5), undefined);
  test.equal(!!hi.modified(), true);

  // remove data
  df.nextPulse.rem.push(data[1]);
  df.touch(c0).run();
  test.equal(map.size(), 2);
  test.equal(map.get('foo'), data[0]);
  test.equal(map.get('boo'), undefined);
  test.equal(map.get('baz'), data[2]);
  test.equal(!!hi.modified(), true);

  test.end();
});
