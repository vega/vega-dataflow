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

  function subtest(len) {
    return function(s, i) {
      var d = s.data.value;
      test.equal(d.length, len===undefined ? i+1 : len);
      test.equal(d.every(function(t) { return t.k === s.key; }), true);
    }
  }

  function key(t) { return t.k; } key.fields = ['k'];
  function val(t) { return t.v; } key.fields = ['v'];

  var df = new dataflow.Dataflow(),
      source = df.add(dataflow.Collect),
      facet = df.add(dataflow.Facet, subflow, {key: key, source: source});


  // -- test adds
  df.nextPulse.add = data;
  df.run();

  test.equal(facet.targets().active, 3); // 3 subflows updated
  test.equal(subs.length, 3); // 3 subflows added
  subs.forEach(subtest(2)); // each subflow should have 2 tuples


  // -- test mods - key change
  dataflow.Tuple.prev_init(data[0], df.clock + 1);
  data[0].k = 'c';
  df.nextPulse.modifies(key.fields).mod = [data[0]];
  df.touch(source).run();

  test.equal(facet.targets().active, 2); // 2 subflows updated
  test.equal(subs.length, 3); // no new subflows added
  subs.forEach(subtest()); // subflows should have 1,2,3 tuples respectively


  // -- test mods - value change
  dataflow.Tuple.prev_init(data[0], df.clock + 1);
  data[1].v = 100;
  df.nextPulse.modifies(val.fields).mod = [data[1]];
  df.touch(source).run();

  test.equal(facet.targets().active, 1); // 1 subflow updated
  test.equal(subs.length, 3); // no new subflows added
  subs.forEach(subtest()); // subflows should have 1,2,3 tuples respectively


  // -- test rems - no disconnects
  df.nextPulse.rem = [data[0], data[2], data[4]];
  df.touch(source).run();

  test.equal(facet.targets().active, 2); // 2 subflows updated
  test.equal(subs.length, 3); // no new subflows added
  subs.forEach(subtest(1)); // each subflow should have 1 tuple


  // -- test rems - empty out a subflow
  df.nextPulse.rem = [data[1], data[3], data[5]];
  df.touch(source).run();

  test.equal(facet.targets().active, 3); // 3 subflows updated
  test.equal(subs.length, 3); // no new subflows added
  subs.forEach(subtest(0)); // each subflow should now be empty


  // -- test adds - repopulate subflows
  df.nextPulse.add = data;
  df.touch(source).run();

  test.equal(facet.targets().active, 3); // 3 subflows updated
  test.equal(subs.length, 3); // no new subflows added
  subs.forEach(subtest()); // subflows should have 1,2,3 tuples respectively


  // -- test adds - new subflow
  df.nextPulse.add = [
    {k:'d', v:4}, {k:'d', v:8}, {k:'d', v:6}, {k:'d', v:0}
  ].map(dataflow.Tuple.ingest);
  df.touch(source).run();

  test.equal(facet.targets().active, 1); // 1 subflow updated
  test.equal(subs.length, 4); // 1 subflow added
  subs.forEach(subtest()); // subflows should have 1,2,3,4 tuples respectively

  test.end();
});
