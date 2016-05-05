var tape = require('tape'),
    dataflow = require('../../');

tape("fold folds tuples", function(test) {
  var data = [
    {a:'!', b:5, c:7},
    {a:'?', b:2, c:4},
  ].map(dataflow.Tuple.ingest);

  var fields = ['b', 'c'].map(function(x) {
    var f = function(t) { return t[x]; };
    f.fields = [x];
    return f;
  });

  var pulse = new dataflow.Pulse(),
      fd = new dataflow.Fold({fields: fields}),
      out, d;

  // -- process adds
  pulse.stamp = 1;
  pulse.add = pulse.source = data;
  out = fd.evaluate(pulse);

  test.equal(out.add.length, 4);
  test.equal(out.mod.length, 0);
  test.equal(out.rem.length, 0);

  d = out.add;
  test.equal(d[0].key, 'b'); test.equal(d[0].value, 5); test.equal(d[0].a, '!');
  test.equal(d[1].key, 'c'); test.equal(d[1].value, 7); test.equal(d[1].a, '!');
  test.equal(d[2].key, 'b'); test.equal(d[2].value, 2); test.equal(d[2].a, '?');
  test.equal(d[3].key, 'c'); test.equal(d[3].value, 4); test.equal(d[3].a, '?');

  // -- process mods
  pulse.stamp++;
  pulse.modifies('b');
  pulse.source[1].b = 9;
  pulse.add = [];
  pulse.mod = [pulse.source[1]];
  out = fd.evaluate(pulse);

  test.equal(out.add.length, 0);
  test.equal(out.mod.length, 1);
  test.equal(out.rem.length, 0);

  d = out.mod;
  test.equal(d[0].key, 'b'); test.equal(d[0].value, 9); test.equal(d[0].a, '?');

  // -- process rems
  pulse.stamp++;
  pulse.fields = {};
  pulse.rem = [pulse.source[0]];
  out = fd.evaluate(pulse);

  test.equal(out.add.length, 0);
  test.equal(out.mod.length, 0);
  test.equal(out.rem.length, 2);

  d = out.rem;
  test.equal(d[0].key, 'b'); test.equal(d[0].value, 5); test.equal(d[0].a, '!');
  test.equal(d[1].key, 'c'); test.equal(d[1].value, 7); test.equal(d[1].a, '!');

  test.end();
});
