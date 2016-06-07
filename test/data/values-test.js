var tape = require('tape'),
    dataflow = require('../../'),
    changeset = dataflow.changeset;

tape('Values extracts values', function(test) {
  var data = [
    {k:'a', v:1}, {k:'b', v:3},
    {k:'c', v:2}, {k:'d', v:4}
  ];

  var key = dataflow.field('k'),
      df = new dataflow.Dataflow(),
      col = df.add(dataflow.Collect),
      val = df.add(dataflow.Values, {field:key, pulse:col});

  df.pulse(col, changeset().insert(data)).run();
  var values = val.value;
  test.deepEqual(values, ['a', 'b', 'c', 'd']);

  df.touch(val).run(); // no-op pulse
  test.equal(val.value, values); // no change!

  test.end();
});

tape('Values extracts sorted domain values', function(test) {
  var byCount = dataflow.compare('-count'),
      key = dataflow.field('k'),
      df = new dataflow.Dataflow(),
      col = df.add(dataflow.Collect),
      agg = df.add(dataflow.Aggregate, {groupby:key, pulse:col}),
      out = df.add(dataflow.Collect, {sort:byCount, pulse:agg}),
      val = df.add(dataflow.Values, {field:key, pulse:out});

  // -- initial
  df.pulse(col, changeset().insert([
    {k:'b', v:1}, {k:'a', v:2}, {k:'a', v:3}
  ])).run();
  test.deepEqual(val.value, ['a', 'b']);

  // -- update
  df.pulse(col, changeset().insert([
    {k:'b', v:1}, {k:'b', v:2}, {k:'c', v:3}
  ])).run();
  test.deepEqual(val.value, ['b', 'a', 'c']);

  test.end();
});

tape('Values extracts multi-domain values', function(test) {
  var byCount = dataflow.compare('-count'),
      count = dataflow.field('count'),
      key = dataflow.field('key'),
      k1 = dataflow.field('k1', 'key'),
      k2 = dataflow.field('k2', 'key'),
      df = new dataflow.Dataflow(),
      col = df.add(dataflow.Collect),
      ag1 = df.add(dataflow.Aggregate, {groupby:k1, pulse:col}),
      ag2 = df.add(dataflow.Aggregate, {groupby:k2, pulse:col}),
      sum = df.add(dataflow.Aggregate, {groupby:key,
        fields:[count], ops:['sum'], as:['count'], pulse:[ag1, ag2]}),
      out = df.add(dataflow.Collect, {sort:byCount, pulse:sum}),
      val = df.add(dataflow.Values, {field:key, pulse:out});

  // -- initial
  df.pulse(col, changeset().insert([
    {k1:'b', k2:'a'}, {k1:'a', k2:'c'}, {k1:'c', k2:'a'}
  ])).run();
  test.deepEqual(val.value, ['a', 'c', 'b']);

  // -- update
  df.pulse(col, changeset().insert([
    {k1:'b', k2:'b'}, {k1:'b', k2:'c'}, {k1:'b', k2:'c'}
  ])).run();
  test.deepEqual(val.value, ['b', 'c', 'a']);

  test.end();
});
