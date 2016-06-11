import Transform from '../Transform';
import {inherits} from '../util/Functions';
import {isFunction} from '../util/Objects';
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

var FORCES = 'forces',
    PARAMS = ['alpha', 'alphaMin', 'alphaTarget', 'drag', 'forces'],
    CONFIG = ['static', 'iterations'],
    FIELDS = ['x', 'y', 'vx', 'vy'];

/**
 * Force simulation layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<object>} params.forces - The forces to apply.
 */
export default function Force(params) {
  Transform.call(this, null, params);
}

var prototype = inherits(Force, Transform);

prototype.transform = function(_, pulse) {
  var sim = this.value,
      change = pulse.changed(pulse.ADD_REM),
      params = _.modified(PARAMS),
      iters = _.iterations || 300;

  // configure simulation
  if (!sim) {
    this.value = sim = simulation(pulse.source, _);
    sim.on('tick', rerun(pulse.dataflow, this));
    if (!_.static) change = true, sim.tick(); // ensure we run on init
    pulse.modifies('index');
  } else {
    if (change) pulse.modifies('index'), sim.nodes(pulse.source);
    if (params) setup(sim, _);
  }

  // fix / unfix nodes as needed
  if (_.modified('fixed')) {
    sim.unfixAll();
    array(_.fixed).forEach(function(t) { sim.fix(t); });
  }

  // run simulation
  if (params || change || pulse.changed() || _.modified(CONFIG)) {
    sim.alpha(Math.max(sim.alpha(), _.alpha || 1))
       .alphaDecay(1 - Math.pow(sim.alphaMin(), 1 / iters));

    if (_.static) {
      for (sim.stop(); --iters >= 0;) sim.tick();
    } else {
      if (sim.stopped()) sim.restart();
      if (!change) return pulse.StopPropagation; // defer to sim ticks
    }
  }

  return pulse.reflow().modifies(FIELDS);
};

function rerun(df, op) {
  return function() { df.touch(op).run(); }
}

function simulation(nodes, _) {
  var sim = forceSimulation(nodes),
      stopped = false,
      stop = sim.stop,
      restart = sim.restart;

  sim.stopped = function() { return stopped; };
  sim.restart = function() { return stopped = false, restart(); };
  sim.stop = function() { return stopped = true, stop(); };

  return setup(sim, _, true).on('end', function() { stopped = true; });
}

function setup(sim, _, init) {
  var f = array(_.forces), i, n, p;

  for (i=0, n=PARAMS.length; i<n; ++i) {
    p = PARAMS[i];
    if (p !== FORCES && _.modified(p)) sim[p](_[p]);
  }

  for (i=0, n=f.length; i<n; ++i) {
    if (init || _.modified(FORCES, i)) {
      sim.force(FORCES + i, getForce(f[i]));
    }
  }
  for (n=(sim.numForces || 0); i<n; ++i) {
    sim.force(FORCES + i, null); // remove
  }

  return sim.numForces = f.length, sim;
}

function getForce(_) {
  var f, p;
  if (!FORCE_MAP.has(_.force)) error('Unrecognized force: ' + _.force);
  f = FORCE_MAP.get(_.force)();
  for (p in _) if (isFunction(f[p])) f[p](_[p]);
  return f;
}
