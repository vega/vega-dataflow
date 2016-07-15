import Transform from '../Transform';
import {error} from '../util/Errors';
import {accessor, inherits} from 'vega-util';
import {map} from 'd3-collection';
import {
  tree, cluster, pack, partition,
  treemap, treemapBinary,
  treemapDice, treemapSlice, treemapSliceDice,
  treemapSquarify, treemapResquarify
} from 'd3-hierarchy';

var TILES = map()
  .set('binary', treemapBinary)
  .set('dice', treemapDice)
  .set('slice', treemapSlice)
  .set('slicedice', treemapSliceDice)
  .set('squarify', treemapSquarify)
  .set('resquarify', treemapResquarify);

var LAYOUTS = map()
  .set('tidy', tree)
  .set('cluster', cluster);

/**
 * Tree layout generator. Supports both 'tidy' and 'cluster' layouts.
 */
function treeLayout(method) {
  var m = method || 'tidy';
  if (LAYOUTS.has(m)) return LAYOUTS.get(m)();
  else error('Unrecognized Tree layout method: ' + m);
}

/**
 * Treemap layout generator. Adds 'method' and 'ratio' parameters
 * to configure the underlying tile method.
 */
function treemapLayout() {
  var x = treemap();
  x.ratio = function(_) {
    var t = x.tile();
    if (t.ratio) x.tile(t.ratio(_));
  };
  x.method = function(_) {
    if (TILES.has(_)) x.tile(TILES.get(_));
    else error('Unrecognized Treemap layout method: ' + _);
  };
  return x;
}

 /**
  * Abstract class for tree layout.
  * @constructor
  * @param {object} params - The parameters for this operator.
  */
export function HierarchyLayout(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(HierarchyLayout, Transform);

prototype.transform = function(_, pulse) {
  if (!pulse.source || !pulse.source.root) {
    error(this.constructor.name + ' transform requires a backing tree data source.');
  }
  var layout = this.layout(_.method),
      root = pulse.source.root;

  if (_.field) root.sum(_.field);
  if (_.sort) root.sort(_.sort);

  this.setParams(layout, _);
  try {
    this.value = layout(root);
  } catch (err) {
    error(err.message);
  }
  root.each(this.setFields);

  return pulse.reflow().modifies(this.setParams.fields); // fork?
};

/**
 * Compile a function that sets parameters on a layout instance.
 */
function setParams(params) {
  var code = '', p;
  for (var i=0, n=params.length; i<n; ++i) {
    p = '"' + params[i] + '"';
    code += 'if(' + p + ' in _) layout[' + p + '](_[' + p + ']);'
  }
  return Function('layout', '_', code);
}

/**
 * Compile a function that writes layout results to output fields.
 */
function setFields(fields) {
  var code = 'var t=node.data;'
  for (var i=0, n=fields.length; i<n; ++i) {
    code += 't["' + fields[i] + '"]=node["' + fields[i] + '"];';
  }
  return accessor(Function('node', code), fields);
}

/**
 * Tree layout. Depending on the method parameter, performs either
 * Reingold-Tilford 'tidy' layout or dendrogram 'cluster' layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 */
export function Tree(params) {
  HierarchyLayout.call(this, params);
}
inherits(Tree, HierarchyLayout);
Tree.prototype.layout = treeLayout;
Tree.prototype.setParams = setParams(['size', 'nodeSize', 'separation']);
Tree.prototype.setFields = setFields(['x', 'y']);

/**
 * Treemap layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to size nodes.
 */
export function Treemap(params) {
  HierarchyLayout.call(this, params);
}
inherits(Treemap, HierarchyLayout);
Treemap.prototype.layout = treemapLayout;
Treemap.prototype.setParams = setParams([
  'method', 'ratio', 'size', 'round',
  'padding', 'paddingInner', 'paddingOuter',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'
]);
Treemap.prototype.setFields = setFields(['x0', 'y0', 'x1', 'y1']);

/**
 * Partition tree layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to size nodes.
 */
export function Partition(params) {
  HierarchyLayout.call(this, params);
}
inherits(Partition, HierarchyLayout);
Partition.prototype.layout = partition;
Partition.prototype.setParams = setParams(['size', 'round', 'padding']);
Partition.prototype.setFields = Treemap.prototype.setFields;

/**
 * Packed circle tree layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to size nodes.
 */
export function Pack(params) {
  HierarchyLayout.call(this, params);
}
inherits(Pack, HierarchyLayout);
Pack.prototype.layout = pack;
Pack.prototype.setParams = setParams(['size', 'padding']);
Pack.prototype.setFields = setFields(['x', 'y', 'r']);
