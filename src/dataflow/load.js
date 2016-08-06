import {load, read} from 'vega-loader';

export function loadOptions(_) {
  return arguments.length ? (this._loadopt = _, this) : this._loadopt;
}

export function request(target, url, format) {
  var df = this;

  df._requests = 1 + (df._requests || 0);

  function decrement() {
    if (--df._requests === 0) df.runAfter(function() { df.run(); });
  }

  load(url, df._loadopt)
    .then(function(data) { return df.ingest(target, data, format); })
    .then(decrement)
    .catch(function(error) {
      df.warn('Loading failed: ' + url, error);
      decrement()
    });
}

export function ingest(target, data, format) {
  this.pulse(target, this.changeset()
      .insert(read(data, format)));
}
