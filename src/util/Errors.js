/**
 * Stub method to centralize error handling.
 * Currently just throws a new error with the given message.
 * @param {string} msg - the error message
 * @throws Error
 */
export function error(msg) {
  throw Error(msg);
}

function message(type, msg) {
  var args = [type].concat([].slice.call(msg));
  console.log.apply(console, args); // eslint-disable-line no-console
}

var level = 0;

export var Levels = {
  Warn: 1,
  Info: 2,
  Debug: 3
}

export function logLevel(_) {
  if (arguments.length) {
    level = +_;
  } else {
    return level;
  }
}

export function warn() {
  if (level >= Levels.Warn) {
    message('WARN', arguments);
  }
}

export function info() {
  if (level >= Levels.Info) {
    message('INFO', arguments);
  }
}

export function debug() {
  if (level >= Levels.Debug) {
    message('DEBUG', arguments);
  }
}

