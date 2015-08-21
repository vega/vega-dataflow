var log = require('vega-logging'),
    ChangeSet = require('./ChangeSet'), 
    Collector = require('./Collector'),
    Tuple = require('./Tuple'),
    Node = require('./Node'); // jshint ignore:line

function DataSource(graph, name, facet) {
  this._graph = graph;
  this._name = name;
  this._data = [];
  this._source = null;
  this._facet = facet;
  this._input = ChangeSet.create();
  this._output = null; // Output changeset

  this._pipeline  = null; // Pipeline of transformations.
  this._collector = null; // Collector to materialize output of pipeline
  this._revises = false;  // Does any pipeline operator need to track prev?
  this._mutates = false;  // Does any pipeline operator mutate tuples?
}

var prototype = DataSource.prototype;

prototype.name = function(name) {
  if (!arguments.length) return this._name;
  return (this._name = name, this);
};

prototype.source = function(src) {
  if (!arguments.length) return this._source;
  return (this._source = this._graph.data(src));
};

prototype.insert = function(tuples) {
  var prev = this._revises ? null : undefined;
  var insert = tuples.map(function(d) {
    return Tuple.ingest(d, prev);
  });

  this._input.add = this._input.add.concat(insert);
  return this;
};

prototype.remove = function(where) {
  var remove = this._data.filter(where);
  this._input.rem = this._input.rem.concat(remove);
  return this;
};

prototype.update = function(where, field, func) {
  var mod = this._input.mod,
      ids = Tuple.idMap(mod);

  this._input.fields[field] = 1;

  this._data.filter(where).forEach(function(x) {
    var prev = x[field],
        next = func(x);
    if (prev !== next) {
      Tuple.set(x, field, next);
      if (ids[x._id] !== 1) {
        mod.push(x);
        ids[x._id] = 1;
      }
    }
  });

  return this;
};

prototype.values = function(data) {
  if (!arguments.length) {
    return this._collector ? this._collector.data() : this._data;
  }

  // Replace backing data
  this._input.rem = this._data.slice();
  if (data) { this.insert(data); }
  return this;
};

prototype.revises = function(p) {
  if (!arguments.length) return this._revises;

  // If we've not needed prev in the past, but a new dataflow node needs it now
  // ensure existing tuples have prev set.
  if (!this._revises && p) {
    this._data.forEach(Tuple.init_prev);
    this._input.add.forEach(Tuple.init_prev); // new tuples haven't been merged
  }

  this._revises = this._revises || p;
  return this;
};

prototype.mutates = function(m) {
  if (!arguments.length) return this._mutates;
  this._mutates = this._mutates || m;
  return this;
};

prototype.last = function() {
  return this._output;
};

prototype.fire = function(input) {
  if (input) this._input = input;
  this._graph.propagate(this._input, this._pipeline[0]);
  return this;
};

prototype.pipeline = function(pipeline) {
  if (!arguments.length) return this._pipeline;

  this._inputNode = DataSourceInput(this);
  this._outputNode = DataSourceOutput(this);

  var graph = this._graph,
      revises = 0,
      mutates = 0,
      collector = this._inputNode,
      i, node, router, collects;

  for (i=0; i<pipeline.length; ++i) {
    node = pipeline[i];

    if (!node._collector && node.batch()) {
      if (router) {
        node = new Collector(graph);
        pipeline.splice(i, 0, node);
        router = false;
      } else {
        node._collector = collector;
      }
    }

    if ((collects = node.collector())) collector = node;
    router = router || node.router() && !collects;
    revises = revises || node.revises();
    mutates = mutates || node.mutates();
  }
  if (router) pipeline.push(collector = new Collector(graph));

  pipeline.unshift(this._inputNode);
  pipeline.push(this._outputNode);
  this._collector = collector;
  this._revises = !!revises;
  this._mutates = !!mutates;
  this._graph.connect(this._pipeline = pipeline);
  return this;
};

prototype.finalize = function() {
  if (this._revises) {
    var data = this.values();
    for (var i=0, n=data.length; i<n; ++i) {
      Tuple.reset_prev(data[i]);
    }
  }
};

prototype.listener = function() { 
  return DataSourceListener(this).addListener(this._inputNode);
};

prototype.addListener = function(l) {
  if (l instanceof DataSource) {
    (this._collector || this._inputNode).addListener(l.listener());
  } else {
    this._outputNode.addListener(l);      
  }
  return this;
};

prototype.removeListener = function(l) {
  this._outputNode.removeListener(l);
};

prototype.listeners = function(ds) {
  return (ds ? this._collector || this._inputNode : this._outputNode)
    .listeners();
};

// Input node applies the datasource's delta, and propagates it to 
// the rest of the pipeline. It receives touches to reflow data.
function DataSourceInput(ds) {
  var input = new Node(ds._graph)
    .router(true)
    .collector(true);

  input.data = function() {
    return ds._data;
  };

  input.evaluate = function(input) {
    log.debug(input, ['input', ds._name]);

    var delta = ds._input, 
        out = ChangeSet.create(input), f;

    // Delta might contain fields updated through API
    for (f in delta.fields) {
      out.fields[f] = 1;
    }

    // update data
    if (delta.rem.length) {
      ds._data = Tuple.idFilter(ds._data, delta.rem);
    }

    if (delta.add.length) {
      ds._data = ds._data.concat(delta.add);
    }

    // if reflowing, add any other tuples not currently in changeset
    if (input.reflow) {
      delta.mod = delta.mod.concat(
        Tuple.idFilter(ds._data, delta.add, delta.mod, delta.rem));
    }

    // reset change list
    ds._input = ChangeSet.create();

    out.add = delta.add; 
    out.mod = delta.mod;
    out.rem = delta.rem;
    out.facet = ds._facet;
    return out;
  };

  return input;
}

// Output node captures the last changeset seen by this datasource
// (needed for joins and builds) and materializes any nested data.
// If this datasource is faceted, materializes the values in the facet.
function DataSourceOutput(ds) {
  var output = new Node(ds._graph)
    .router(true)
    .reflows(true)
    .collector(true);

  output.data = function() {
    return ds._collector ? ds._collector.data() : ds._data;
  };

  output.evaluate = function(input) {
    log.debug(input, ['output', ds._name]);

    var out = ChangeSet.create(input, true);

    if (ds._facet) {
      ds._facet.values = ds.values();
      input.facet = null;
    }

    ds._output = input;
    out.data[ds._name] = 1;
    return out;
  };

  return output;
}

function DataSourceListener(ds) {
  var l = new Node(ds._graph).router(true);

  l.evaluate = function(input) {
    // Tuple derivation carries a cost. So only derive if the pipeline has
    // operators that mutate, and thus would override the source data.
    if (ds.mutates()) {  
      var map = ds._srcMap || (ds._srcMap = {}), // to propagate tuples correctly
          output = ChangeSet.create(input);

      output.add = input.add.map(function(t) {
        return (map[t._id] = Tuple.derive(t, ds._revises));
      });

      output.mod = input.mod.map(function(t) {
        return Tuple.rederive(t, map[t._id]);
      });

      output.rem = input.rem.map(function(t) { 
        var o = map[t._id];
        return (map[t._id] = null, o);
      });

      return (ds._input = output);
    } else {
      return (ds._input = input);
    }
  };

  return l;
}

module.exports = DataSource;
