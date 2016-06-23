var tape = require('tape'),
    dataflow = require('../../'),
    changeset = dataflow.changeset;

tape('Relay relays derived tuples', function(test) {
  var data = [{'id': 0}, {'id': 1}];

  var id = dataflow.field('id'),
      df = new dataflow.Dataflow(),
      c = df.add(dataflow.Collect),
      r = df.add(dataflow.Relay, {pulse:c}),
      p;

  df.pulse(c, changeset().insert(data)).run();
  p = r.pulse;
  test.equal(p.add.length, 2);
  test.equal(p.rem.length, 0);
  test.equal(p.mod.length, 0);
  test.notEqual(p.add[0], data[0]);
  test.notEqual(p.add[1], data[1]);
  test.deepEqual(p.add.map(id), [0, 1]);

  df.pulse(c, changeset()
    .modify(function() { return 1; }, 'id', function(t) { return t.id + 2; }))
    .run();
  p = r.pulse;
  test.equal(p.add.length, 0);
  test.equal(p.rem.length, 0);
  test.equal(p.mod.length, 2);
  test.notEqual(p.mod[0], data[0]);
  test.notEqual(p.mod[1], data[1]);
  test.deepEqual(p.mod.map(id), [2, 3]);

  df.pulse(c, changeset().remove(data)).run();
  p = r.pulse;
  test.equal(p.add.length, 0);
  test.equal(p.rem.length, 2);
  test.equal(p.mod.length, 0);
  test.notEqual(p.rem[0], data[0]);
  test.notEqual(p.rem[1], data[1]);
  test.deepEqual(p.rem.map(id), [2, 3]);

  test.end();
});
