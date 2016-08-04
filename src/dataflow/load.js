import {load, read} from 'vega-loader';

export function loadOptions(_) {
  return arguments.length ? (this._loadopt = _, this) : this._loadopt;
}

export function request(target, url, format) {
  var df = this;

  df._requests = 1 + (df._requests || 0);

  load(url, df._loadopt, function(err, data) {
    if (!err) {
      try {
        df.ingest(target, data, format);
      } catch (e) { err = e; }
    }

    if (err) {
      df.warn('Loading failed: ' + url, err);
    }

    if (--df._requests === 0) {
      df.runAfter(function() { df.run(); });
    }
  });
}

export function ingest(target, data, format) {
  this.pulse(target, this.changeset()
      .insert(read(data, format)));
}
