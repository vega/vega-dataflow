export var Empty = [];

export function array(_) {
  return _ != null ? (Array.isArray(_) ? _ : [_]) : [];
}
