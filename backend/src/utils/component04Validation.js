const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
function uuid(value) {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw fail('Invalid resource ID.');
  return value;
}
function text(value, name, max, optional = false) {
  if (typeof value !== 'string' || (!optional && !value.trim()) || value.trim().length > max) throw fail(`${name} ${optional ? 'must be' : 'is required and must be'} ${max} characters or fewer.`);
  return value.trim();
}
function schedule(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value)) || Date.parse(value) <= Date.now()) throw fail('Choose a future reminder date/time with a timezone.');
  const [year, month, day, hour, minute] = value.slice(0, 16).split(/[-T:]/).map(Number);
  if (month < 1 || month > 12 || day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate() || hour > 23 || minute > 59) throw fail('Choose a valid calendar date/time.');
  return new Date(value).toISOString();
}
module.exports = { fail, uuid, text, schedule };
