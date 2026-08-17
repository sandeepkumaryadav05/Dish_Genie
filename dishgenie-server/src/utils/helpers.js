/**
 * Escape special regex characters in a string so it can be used safely in
 * a RegExp constructor.
 */
function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Create a 400 Bad Request error with the given message.
 */
function badRequest(message) {
  return Object.assign(new Error(message), { status: 400 });
}

/**
 * Parse a value as a boolean. Accepts booleans, numeric strings ("0"/"1"),
 * truthy strings ("true"/"yes"/"y") and falsy strings ("false"/"no"/"n").
 * Returns `undefined` when the value cannot be interpreted as a boolean.
 */
function parseBool(val) {
  if (val === undefined || val === null) return undefined;
  if (typeof val === 'boolean') return val;
  if (val === 'true' || val === '1' || val === 1) return true;
  if (val === 'false' || val === '0' || val === 0) return false;
  return undefined;
}

module.exports = { escapeRegExp, badRequest, parseBool };
