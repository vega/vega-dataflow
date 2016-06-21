var tape = require('tape'),
    dataflow = require('../../');

tape('field creates a field accessor', function(test) {
  var f = dataflow.field('x');
  test.equal(typeof f, 'function');
  test.equal(f.fname, 'x');
  test.deepEqual(f.fields, ['x']);
  test.equal(f({x:'foo'}), 'foo');
  test.equal(f({x:0}), 0);

  f = dataflow.field('[1].x');
  test.equal(typeof f, 'function');
  test.equal(f.fname, '[1].x');
  test.deepEqual(f.fields, ['[1].x']);
  test.equal(f([{x:'foo'},{x:'bar'}]), 'bar');
  test.equal(f([{x:1},{x:0}]), 0);

  f = dataflow.field('x["y"].z');
  test.equal(typeof f, 'function');
  test.equal(f.fname, 'x["y"].z');
  test.deepEqual(f.fields, ['x["y"].z']);
  test.equal(f({x:{y:{z:'bar'}}}), 'bar');
  test.equal(f({x:{y:{z:0}}}), 0);

  f = dataflow.field('x[y].z');
  test.equal(typeof f, 'function');
  test.equal(f.fname, 'x[y].z');
  test.deepEqual(f.fields, ['x[y].z']);
  test.equal(f({x:{y:{z:'bar'}}}), 'bar');
  test.equal(f({x:{y:{z:0}}}), 0);

  f = dataflow.field('x["a.b"].z');
  test.equal(typeof f, 'function');
  test.equal(f.fname, 'x["a.b"].z');
  test.deepEqual(f.fields, ['x["a.b"].z']);
  test.equal(f({x:{'a.b':{z:'bar'}}}), 'bar');
  test.equal(f({x:{'a.b':{z:0}}}), 0);

  f = dataflow.field('x[a.b].z');
  test.equal(typeof f, 'function');
  test.equal(f.fname, 'x[a.b].z');
  test.deepEqual(f.fields, ['x[a.b].z']);
  test.equal(f({x:{'a.b':{z:'bar'}}}), 'bar');
  test.equal(f({x:{'a.b':{z:0}}}), 0);

  f = dataflow.field('x[a b].z');
  test.equal(typeof f, 'function');
  test.equal(f.fname, 'x[a b].z');
  test.deepEqual(f.fields, ['x[a b].z']);
  test.equal(f({x:{'a b':{z:'bar'}}}), 'bar');
  test.equal(f({x:{'a b':{z:0}}}), 0);

  f = dataflow.field('x.a b.z');
  test.equal(typeof f, 'function');
  test.equal(f.fname, 'x.a b.z');
  test.deepEqual(f.fields, ['x.a b.z']);
  test.equal(f({x:{'a b':{z:'bar'}}}), 'bar');
  test.equal(f({x:{'a b':{z:0}}}), 0);
  test.end();
});
