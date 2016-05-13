var tape = require('tape'),
    dataflow = require('../../');

tape('aggregate aggregates tuples', function(test) {
  var data = [
    {k:'a', v:1}, {k:'b', v:3},
    {k:'a', v:2}, {k:'b', v:4}
  ].map(dataflow.Tuple.ingest);

  var key = dataflow.field('k'),
      val = dataflow.field('v'),
      df = new dataflow.Dataflow(),
      agg = df.add(dataflow.Aggregate, {
        groupby: [key],
        fields: [val, val, val, val],
        ops: ['count', 'sum', 'min', 'max']
      }),
      out = df.add(dataflow.Collect, {source: agg});

  // -- test adds
  df.nextPulse.add = data;
  df.run();

  var d = out.value;
  test.equal(d.length, 2);
  test.equal(d[0].k, 'a');
  test.equal(d[0].count_v, 2);
  test.equal(d[0].sum_v, 3);
  test.equal(d[0].min_v, 1);
  test.equal(d[0].max_v, 2);
  test.equal(d[1].k, 'b');
  test.equal(d[1].count_v, 2);
  test.equal(d[1].sum_v, 7);
  test.equal(d[1].min_v, 3);
  test.equal(d[1].max_v, 4);

  // -- test rems
  df.nextPulse.rem = data.slice(0, 2);
  df.touch(agg).run();

  d = out.value;
  test.equal(d.length, 2);
  test.equal(d[0].k, 'a');
  test.equal(d[0].count_v, 1);
  test.equal(d[0].sum_v, 2);
  test.equal(d[0].min_v, 2);
  test.equal(d[0].max_v, 2);
  test.equal(d[1].k, 'b');
  test.equal(d[1].count_v, 1);
  test.equal(d[1].sum_v, 4);
  test.equal(d[1].min_v, 4);
  test.equal(d[1].max_v, 4);

  // -- test mods, no groupby change
  dataflow.Tuple.prev_init(data[2], df.clock + 1);
  data[2].v = 3;
  df.nextPulse.mod = [data[2]];
  df.nextPulse.modifies(val.fields);
  df.touch(agg).run();

  d = out.value;
  test.equal(d.length, 2);
  test.equal(d[0].k, 'a');
  test.equal(d[0].count_v, 1);
  test.equal(d[0].sum_v, 3);
  test.equal(d[0].min_v, 3);
  test.equal(d[0].max_v, 3);
  test.equal(d[1].k, 'b');
  test.equal(d[1].count_v, 1);
  test.equal(d[1].sum_v, 4);
  test.equal(d[1].min_v, 4);
  test.equal(d[1].max_v, 4);

  // -- test mods, groupby change
  dataflow.Tuple.prev_init(data[2], df.clock + 1);
  data[2].k = 'b';
  df.nextPulse.mod = [data[2]];
  df.nextPulse.modifies(key.fields);
  df.touch(agg).run();

  d = out.value;
  test.equal(d.length, 1);
  test.equal(d[0].k, 'b');
  test.equal(d[0].count_v, 2);
  test.equal(d[0].sum_v, 7);
  test.equal(d[0].min_v, 3);
  test.equal(d[0].max_v, 4);

  test.end();

});
