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

  df._pulse.add = data;
  df.run();

  test.equal(subs.length, 3);
  subs.forEach(function(s, i) {
    var d = s.data.value;
    test.equal(d.length, 2);
    test.equal(d.every(function(t) {
      return t.k === s.key;
    }), true);
  });

  test.end();
});
