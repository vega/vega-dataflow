var tape = require('tape'),
    dataflow = require('../../');

tape('Relay relays derived tuples', function(test) {
  var data = [{'id': 0}, {'id': 1}].map(dataflow.Tuple.ingest);

  var id = dataflow.field('id'),
      df = new dataflow.Dataflow(),
      r = df.add(dataflow.Relay),
      p;

  function previous(t) {
    return dataflow.Tuple.prev(t, df.clock);
  }

  df.nextPulse.add = data;
  df.run();
  p = r.pulse;
  test.equal(p.add.length, 2);
  test.equal(p.rem.length, 0);
  test.equal(p.mod.length, 0);
  test.notEqual(p.add[0], data[0]);
  test.notEqual(p.add[1], data[1]);
  test.deepEqual(p.add.map(id), [0, 1]);

  df.nextPulse.mod = data.map(function(t) {
    dataflow.Tuple.prev_init(t, df.clock+1);
    return (t.id += 2, t);
  });
  df.nextPulse.modifies('id');
  df.touch(r).run();
  p = r.pulse;
  test.equal(p.add.length, 0);
  test.equal(p.rem.length, 0);
  test.equal(p.mod.length, 2);
  test.notEqual(p.mod[0], data[0]);
  test.notEqual(p.mod[1], data[1]);
  test.notEqual(previous(p.mod[0]), previous(data[0]));
  test.notEqual(previous(p.mod[1]), previous(data[1]));
  test.deepEqual(p.mod.map(id), [2, 3]);

  df.nextPulse.rem = data.slice();
  df.touch(r).run();
  p = r.pulse;
  test.equal(p.add.length, 0);
  test.equal(p.rem.length, 2);
  test.equal(p.mod.length, 0);
  test.notEqual(p.rem[0], data[0]);
  test.notEqual(p.rem[1], data[1]);
  test.deepEqual(p.rem.map(id), [2, 3]);

  test.end();
});
