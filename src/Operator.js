import UniqueList from './util/UniqueList';
import Parameters from './util/Parameters';

var OP_ID = 0;
var NO_PARAMS = new Parameters();

/**
 * An Operator is a processing node in a dataflow graph.
 * Each operator stores a value and an optional value update function.
 * Operators can accept a hash of named parameters. Parameter values can
 * either be direct (JavaScript literals, arrays, objects) or indirect
 * (other operators whose values will be pulled dynamically). Operators
 * included as parameters will have this operator added as a dependency.
 * @constructor
 * @param {*} [init] - The initial value for this operator.
 * @param {function(object, Pulse)} [update] - An update function. Upon
 *   evaluation of this operator, the update function will be invoked and the
 *   return value will be used as the new value of this operator.
 * @param {object} [params] - The parameters for this operator.
 * @see parameters
 */
export default function Operator(init, update, params) {
  this.id = ++OP_ID;
  this.stamp = -1;
  this.rank = -1;
  this.value = init;
  if (update) {
    this._fn = update;
    this._skip = false;
  }
  if (params) this.parameters(params);
}

var prototype = Operator.prototype;

/**
 * Returns a list of target operators dependent on this operator.
 * If this list does not exist, it is created and then returned.
 * @return {UniqueList}
 */
prototype.targets = function() {
  return this._targets || (this._targets = UniqueList());
};

/**
 * Sets the value of this operator.
 * @param {*} value - the value to set.
 * @return {Number} Returns 1 if the operator value has changed
 *   according to strict equality, returns 0 otherwise.
 */
prototype.set = function(value) {
  return this.value !== value ? (this.value = value, 1) : 0;
};

/**
 * Indicates that operator evaluation should be skipped on the next pulse.
 * This operator will still propagate incoming pulses, but its update function
 * will not be invoked. The skip flag is reset after every pulse, so calling
 * this method will affect processing of the next pulse only.
 */
prototype.skip = function() {
  this._skip = true;
};

/**
 * Sets the parameters for this operator. The parameter values are analyzed for
 * operator instances. If found, this operator will be added as a dependency
 * of the parameterizing operator. Operator values are dynamically marshalled
 * from each operator parameter prior to evaluation. If a parameter value is
 * an array, the array will also be searched for Operator instances. However,
 * the search does not recurse into sub-arrays or object properties.
 * @param {object} params - A hash of operator parameters.
 * @return {Operator} this operator instance.
 */
prototype.parameters = function(params) {
  var self = this,
      argval = (self._argval = self._argval || new Parameters()),
      argops = (self._argops = self._argops || []),
      name, value, pulse, n, i;

  function add(name, value, index, pulse) {
    // TODO: revisit parse rules to access operator pulse (or other properties?)
    if (value instanceof Operator) {
      if (value !== self) value.targets().add(self);
      argops.push({op:value, name:name, index:index, pulse:pulse});
    } else {
      argval.set(name, value, index);
    }
    if (name === 'source' && index < 0) {
      self.source = value;
    }
  }

  for (name in params) {
    value = params[name];

    // prepend names with '!' to request an operator's output pulse
    pulse = (name[0] === '!') ? (name = name.slice(1), 1) : 0;

    if (Array.isArray(value)) {
      argval.set(name, Array(n = value.length), -1, pulse);
      for (i=0; i<n; ++i) add(name, value[i], i, pulse);
    } else {
      add(name, value, -1, pulse);
    }
  }

  return self;
};

/**
 * Internal method for marshalling parameter values.
 * Visits each operator dependency to pull the latest value.
 * @return {Parameters} A Parameters object to pass to the update function.
 */
prototype.marshall = function() {
  var argval = this._argval || NO_PARAMS,
      argops = this._argops, item, value, i, n;

  if (argops && (n = argops.length)) {
    for (i=0; i<n; ++i) {
      item = argops[i];
      value = item.pulse ? item.op.pulse : item.op.value;
      argval.set(item.name, value, item.index);
    }
  }
  return argval;
};

/**
 * Delegate method to perform operator processing.
 * Subclasses can override this method to perform custom processing.
 * By default, it marshalls parameters and calls the update function
 * if that function is defined. If the update function does not
 * change the operator value then StopPropagation is returned.
 * If no update function is defined, this method does nothing.
 * @param {Pulse} pulse - the current dataflow pulse.
 * @return The output pulse or StopPropagation. A falsy return value
 *   (including undefined) will let the input pulse pass through.
 */
prototype.evaluate = function(pulse) {
  if (this._fn && !this._skip) {
    var params = this.marshall(),
        v = this._fn(params, pulse);

    params.clear();
    if (v !== this.value) {
      this.value = v;
    } else {
      return pulse.StopPropagation;
    }
  }
};

/**
 * Run this operator for the current pulse. If this operator has already
 * been run at (or after) the pulse timestamp, returns StopPropagation.
 * Internally, this method calls {@link evaluate} to perform processing.
 * If {@link evaluate} returns a falsy value, the input pulse is returned.
 * This method should NOT be overridden, instead overrride {@link evaluate}.
 * @param {Pulse} pulse - the current dataflow pulse.
 * @return the output pulse for this operator (or StopPropagation)
 */
prototype.run = function(pulse) {
  if (pulse.stamp <= this.stamp) return pulse.StopPropagation;
  var rv = this.evaluate(pulse) || pulse;
  this.stamp = pulse.stamp;
  return (this._skip = false, this.pulse = rv);
};
