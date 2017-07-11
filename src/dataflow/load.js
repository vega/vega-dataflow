import {read} from 'vega-loader';

export function ingest(target, data, format) {
  return this.pulse(target, this.changeset().insert(read(data, format)));
}

function loadPending(df) {
  var accept, reject,
      pending = new Promise(function(a, r) {
        accept = a;
        reject = r;
      });

  pending.requests = 0;

  pending.done = function() {
    if (--pending.requests === 0) {
      df.runAfter(function() {
        df._pending = null;
        try {
          df.run();
          accept(df);
        } catch (err) {
          reject(err);
        }
      });
    }
  };

  df._pending = pending;
  return pending;
}

export function request(target, url, format) {
  var df = this,
      pending = df._pending || loadPending(df);

  pending.requests += 1;

  df.loader()
    .load(url, {context:'dataflow'})
    .then(
      function(data) {
        df.ingest(target, data, format);
      },
      function(error) {
        df.error('Loading failed: ' + url, error);
        pending.done();
      })
    .then(pending.done)
    .catch(function(error) { df.error(error); });
}
