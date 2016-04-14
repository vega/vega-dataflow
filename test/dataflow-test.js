var tape = require('tape'),
    dataflow = require('../');

tape("dataflow propagates values", function(test) {
  var df = new dataflow.Dataflow(),
      s1 = df.define('s1', 10),
      s2 = df.define('s2', 3),
      n1 = df.define('n1', 0, function(_) { return _.s1 + 0.25; }, {s1:s1}),
      n2 = df.define('n2', 0, function(_) { return _.n1 * _.s2; }, {n1:n1, s2:s2});

  df.run();
  test.equal(n2.value, 30.75);

  df.update('s1', 5).run();
  test.equal(n2.value, 15.75);

  df.update('s2', 1).run();
  test.equal(n2.value, 5.25);

  test.end();
});
