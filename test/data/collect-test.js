var tape = require('tape'),
    dataflow = require('../../');

tape('Collect collects tuples', function(test) {
  var data = [
    {'id': 1, 'value': 'foo'},
    {'id': 3, 'value': 'bar'},
    {'id': 5, 'value': 'baz'}
  ].map(dataflow.Tuple.ingest);

  var df = new dataflow.Dataflow(),
      so = df.add(null),
      c0 = df.add(dataflow.Collect, {sort:so});

  df.run(); // initialize
  test.equal(c0.value.length, 0);
  test.equal(!!c0.modified(), false);

  // add data
  df.nextPulse.add = data;
  df.touch(c0).run();
  test.equal(c0.value.length, 3);
  test.equal(c0.value[0], data[0]);
  test.equal(c0.value[1], data[1]);
  test.equal(c0.value[2], data[2]);
  test.equal(!!c0.modified(), true);

  // sort data
  df.update(so, dataflow.compare('value')).run();
  test.equal(c0.value.length, 3);
  test.equal(c0.value[0], data[1]);
  test.equal(c0.value[1], data[2]);
  test.equal(c0.value[2], data[0]);
  test.equal(!!c0.modified(), true);

  // add new data
  data.push(dataflow.Tuple.ingest({id:2, value:'abc'}));
  df.nextPulse.add.push(data[3]);
  df.touch(c0).run();
  test.equal(c0.value.length, 4);
  test.equal(c0.value[0], data[3]);
  test.equal(c0.value[1], data[1]);
  test.equal(c0.value[2], data[2]);
  test.equal(c0.value[3], data[0]);
  test.equal(!!c0.modified(), true);

  // remove data
  df.nextPulse.rem.push(data[1]);
  df.touch(c0).run();
  test.equal(c0.value.length, 3);
  test.equal(c0.value[0], data[3]);
  test.equal(c0.value[1], data[2]);
  test.equal(c0.value[2], data[0]);
  test.equal(!!c0.modified(), true);

  // modify data
  dataflow.Tuple.prev_init(data[0], df.clock + 1);
  data[0].value = 'boo';
  df.nextPulse.mod.push(data[0]);
  df.nextPulse.modifies('value');
  df.touch(c0).run();
  test.equal(c0.value.length, 3);
  test.equal(c0.value[0], data[3]);
  test.equal(c0.value[1], data[2]);
  test.equal(c0.value[2], data[0]);
  test.equal(!!c0.modified(), true);

  // do nothing
  df.touch(c0).run();
  test.equal(c0.value.length, 3);
  test.equal(!!c0.modified(), false);

  test.end();
});
