var tape = require('tape'),
    util = require('vega-util'),
    vega = require('../../'),
    changeset = vega.changeset,
    Collect = vega.transforms.Collect,
    CountIndex = vega.transforms.CountIndex;

function size(map) {
  var count = 0, key;
  for (key in map) if (map[key] > 0) ++count;
  return count;
}

tape('CountIndex maintains an index of counts', function(test) {
  var data = [
    {'id': 1, 'value': 'foo'},
    {'id': 2, 'value': 'foo'},
    {'id': 3, 'value': 'bar'},
    {'id': 4, 'value': 'foo'},
    {'id': 5, 'value': 'baz'}
  ];

  var id = util.field('id'),
      va = util.field('value'),
      df = new vega.Dataflow(),
      c0 = df.add(Collect),
      fi = df.add(null), // populate with field accessor later
      ci = df.add(CountIndex, {field:fi, pulse:c0}),
      map;

  df.update(fi, va).run(); // inicialize

  // add data
  df.pulse(c0, changeset().insert(data)).run();
  map = ci.value;
  test.equal(size(map), 3);
  test.equal(map['foo'], 3);
  test.equal(map['bar'], 1);
  test.equal(map['baz'], 1);
  test.equal(map['boo'], undefined);
  test.equal(ci.modified(), true);

  // change key field value
  df.pulse(c0, changeset().modify(data[0], 'value', 'bar')).run();
  map = ci.value;
  test.equal(size(map), 3);
  test.equal(map['foo'], 2);
  test.equal(map['bar'], 2);
  test.equal(map['baz'], 1);
  test.equal(map['boo'], undefined);
  test.equal(ci.modified(), true);

  // change non-key field value
  df.pulse(c0, changeset().modify(data[1], 'id', 1)).run();
  map = ci.value;
  test.equal(size(map), 3);
  test.equal(map['foo'], 2);
  test.equal(map['bar'], 2);
  test.equal(map['baz'], 1);
  test.equal(map['boo'], undefined);
  test.equal(ci.modified(), false);

  // do nothing
  df.touch(c0).touch(ci).run();
  map = ci.value;
  test.equal(size(map), 3);
  test.equal(ci.modified(), false);

  // change field being indexed
  df.update(fi, id).run();
  map = ci.value;
  test.equal(size(map), 4);
  test.equal(map[1], 2);
  test.equal(map[2], undefined);
  test.equal(map[3], 1);
  test.equal(map[4], 1);
  test.equal(map[5], 1);
  test.equal(ci.modified(), true);

  // remove data
  df.pulse(c0, changeset().remove(data[2])).run();
  test.equal(size(map), 3);
  test.equal(map[1], 2);
  test.equal(map[2], undefined);
  test.equal(map[3], 0);
  test.equal(map[4], 1);
  test.equal(map[5], 1);
  test.equal(ci.modified(), true);

  test.end();
});
