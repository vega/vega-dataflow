var tape = require('tape'),
    dataflow = require('../../');

tape('compare compares numbers', function(test) {
  var c = dataflow.compare('x');
  test.equal(c({x:1}, {x:0}), 1);
  test.equal(c({x:0}, {x:1}), -1);
  test.equal(c({x:1}, {x:1}), 0);
  test.equal(c({x:0}, {x:null}), 1);
  test.equal(c({x:null}, {x:0}), -1);
  test.equal(c({x:-1}, {x:null}), 1);
  test.equal(c({x:null}, {x:-1}), -1);
  test.equal(c({x:0}, {x:undefined}), 1);
  test.equal(c({x:undefined}, {x:0}), -1);
  test.equal(c({x:0}, {x:NaN}), 1);
  test.equal(c({x:NaN}, {x:0}), -1);
  test.end();
});

tape('compare compares strings', function(test) {
  var c = dataflow.compare('x');
  test.equal(c({x:'b'}, {x:'a'}), 1);
  test.equal(c({x:'a'}, {x:'b'}), -1);
  test.equal(c({x:'b'}, {x:'b'}), 0);
  test.equal(c({x:'a'}, {x:''}), 1);
  test.equal(c({x:''}, {x:'a'}), -1);
  test.equal(c({x:''}, {x:null}), 1);
  test.equal(c({x:null}, {x:''}), -1);
  test.equal(c({x:''}, {x:undefined}), 1);
  test.equal(c({x:undefined}, {x:''}), -1);
  test.equal(c({x:''}, {x:NaN}), 1);
  test.equal(c({x:NaN}, {x:''}), -1);
  test.end();
});

tape('compare compares dates', function(test) {
  var c = dataflow.compare('x');
  test.equal(c({x:new Date(1)}, {x:new Date(0)}), 1);
  test.equal(c({x:new Date(0)}, {x:new Date(1)}), -1);
  test.equal(c({x:new Date(1)}, {x:new Date(1)}), 0);
  test.equal(c({x:new Date(0)}, {x:new Date(NaN)}), 1);
  test.equal(c({x:new Date(NaN)}, {x:new Date(0)}), -1);
  test.equal(c({x:new Date(NaN)}, {x:new Date(NaN)}), 0);
  test.equal(c({x:new Date(0)}, {x:null}), 1);
  test.equal(c({x:null}, {x:new Date(0)}), -1);
  test.equal(c({x:new Date(0)}, {x:undefined}), 1);
  test.equal(c({x:undefined}, {x:new Date(0)}), -1);
  test.equal(c({x:new Date(0)}, {x:NaN}), 1);
  test.equal(c({x:NaN}, {x:new Date(0)}), -1);
  test.end();
});

tape('compare treats null, undefined and NaN as equivalent', function(test) {
  var c = dataflow.compare('x');
  test.equal(c({x:null}, {x:undefined}), 0);
  test.equal(c({x:undefined}, {x:null}), 0);
  test.equal(c({x:null}, {x:NaN}), 0);
  test.equal(c({x:NaN}, {x:null}), 0);
  test.equal(c({x:undefined}, {x:NaN}), 0);
  test.equal(c({x:NaN}, {x:undefined}), 0);
  test.equal(c({x:null}, {x:null}), 0);
  test.equal(c({x:undefined}, {x:undefined}), 0);
  test.equal(c({x:NaN}, {x:NaN}), 0);
  test.end();
});

tape('compare supports descending order', function(test) {
  var c = dataflow.compare('x', 'descending');
  test.equal(c({x:1}, {x:0}), -1);
  test.equal(c({x:0}, {x:1}), 1);
  test.equal(c({x:1}, {x:1}), 0);
  test.deepEqual(c.fields, ['x']);
  test.end();
});

tape('compare supports nested comparison', function(test) {
  var c = dataflow.compare(['x', 'y'], ['descending', 'ascending']);
  test.equal(c({x:1,y:0}, {x:0,y:1}), -1);
  test.equal(c({x:0,y:1}, {x:1,y:0}), 1);
  test.equal(c({x:0,y:0}, {x:0,y:1}), -1);
  test.equal(c({x:0,y:1}, {x:0,y:0}), 1);
  test.equal(c({x:0,y:0}, {x:0,y:0}), 0);
  test.deepEqual(c.fields, ['x', 'y']);
  test.end();
});
