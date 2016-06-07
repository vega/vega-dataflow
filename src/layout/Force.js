import Transform from '../data/Transform';
import {inherits, isFunction} from '../util/Functions';
import {array} from '../util/Arrays';
import {error} from '../util/Errors';

import {map} from 'd3-collection';
import {
  forceSimulation, forceCenter, forceCollide,
  forceManyBody, forceLink, forceX, forceY
} from 'd3-force';

var FORCE_MAP = map()
  .set('center', forceCenter)
  .set('collide', forceCollide)
  .set('nbody', forceManyBody)
  .set('link', forceLink)
  .set('x', forceX)
  .set('y', forceY);

var PARAMS = ['alpha', 'alphaMin', 'alphaDecay', 'alphaTarget', 'drag', 'forces'];
var FORCES = 'forces';
var FIELDS = ['x', 'y', 'vx', 'vy', 'index'];

// TODO: unfixAll support in d3-force?
function simulation(nodes) {
  var sim = forceSimulation(nodes),
      fix = sim.fix,
      unfix = sim.unfix,
      fixed = {};
  sim.fix = function(node, x, y) {
    fix(node, x, y);
    fixed[node.index] = node;
  };
  sim.unfix = function(node) {
    if (!arguments.length) {
      for (var index in fixed) unfix(fixed[index]);
      return fixed = {}, sim;
    } else {
      return unfix(node);
    }
  };
  return sim;
}

/**
 * Force simulation layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<object>} params.forces - The forces to apply.
 */
export default function Force(params) {
  Transform.call(this, null, params);
  this.stopped = false;
}

var prototype = inherits(Force, Transform);

prototype.transform = function(_, pulse) {
  var sim = this.value,
      tuples = pulse.changed(pulse.ADD | pulse.REM),
      params = _.modified(PARAMS),
      fixed = array(_.fixed),
      iter = _.iterations;

  // configure simulation
  if (!sim) {
    this.value = sim = initialize(simulation(pulse.source), _, true);
    sim.on('tick', rerun(pulse.dataflow, this));
    sim.on('end', (function() { this.stopped = true; }).bind(this));
  } else {
    if (tuples) sim.nodes(pulse.source);
    if (params) initialize(sim, _, false);
  }

  // fix / unfix nodes as needed
  if (_.modified('fixed')) {
    sim.unfix();
    fixed.forEach(function(t) { sim.fix(t); });
  }

  // run simulation
  if (iter) {
    for (sim.stop(), this.stopped = true; --iter >= 0;) {
      sim.alpha(_.alpha || 1).tick();
    }
  } else if (params || tuples || pulse.changed(pulse.MOD)) {
    sim.alpha(Math.max(sim.alpha(), _.alpha || 0.5));
    if (this.stopped) this.stopped = false, sim.restart(); // restart sim
    if (!tuples) return pulse.StopPropagation; // defer to sim ticks
  }

  return pulse.reflow().modifies(FIELDS);
};

function rerun(df, op) {
  return function() { df.touch(op).run(); }
}

function initialize(sim, _, init) {
  var i, n, p;
  for (i=0, n=PARAMS.length; i<n; ++i) {
    p = PARAMS[i];
    if (p !== FORCES && _.modified(p)) sim[p](_[p]);
  }
  // TODO handle force removal; use indices as names?
  for (i=0, n=array(_.forces).length; i<n; ++i) {
    if (init || _.modified(FORCES, i)) {
      p = _.forces[i];
      sim.force(p.type, getForce(p));
    }
  }
  return sim;
}

function getForce(_) {
  if (!FORCE_MAP.has(_.type)) {
    error('Unrecognized Force type: ' + _.type);
  }
  var f = FORCE_MAP.get(_.type)();
  for (var p in _) if (isFunction(f[p])) f[p](_[p]);
  return f;
}
