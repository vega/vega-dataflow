var tape = require('tape'),
    dataflow = require('../../');

tape("facet facets tuples", function(test) {
  var data = [
    {k:'a', v:5}, {k:'b', v:7}, {k:'c', v:9},
    {k:'a', v:1}, {k:'b', v:2}, {k:'c', v:3}
  ].map(dataflow.Tuple.ingest);

  var subs = [];

  function subflow(df, key) {
    var col = df.add(dataflow.Collect);
    subs.push({key: key, data: col});
    return col;
  }

  function key(t) { return t.k; } key.fields = ['k'];
  function val(t) { return t.v; } key.fields = ['v'];

  var df = new dataflow.Dataflow(),
      c  = df.add(dataflow.Collect),
      f  = df.add(dataflow.Facet, subflow, {key: key, source: c});

  // test adds
  df._pulse.add = data;
  df.run();

  test.equal(subs.length, 3);
  subs.forEach(function(s, i) {
    var d = s.data.value;
    test.equal(d.length, 2);
    test.equal(d.every(function(t) { return t.k === s.key; }), true);
  });

  // test mods - key change
  dataflow.Tuple.prev_init(data[0], df._clock + 1);
  data[0].k = 'c';

  df._pulse.mod = [data[0]];
  df._pulse.modifies(key.fields);
  df.touch(c);
  df.run();

  test.equal(subs.length, 3);
  subs.forEach(function(s, i) {
    var d = s.data.value;
    test.equal(d.length, i+1);
    test.equal(d.every(function(t) { return t.k === s.key; }), true);
  });

  // test rems
  df._pulse.rem = [data[0], data[2], data[4]];
  df.touch(c);
  df.run();

  test.equal(subs.length, 3);
  subs.forEach(function(s, i) {
    var d = s.data.value;
    test.equal(d.length, 1);
    test.equal(d.every(function(t) { return t.k === s.key; }), true);
  });

  test.end();
});
