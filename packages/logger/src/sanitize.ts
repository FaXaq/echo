export const PII_FIELDS = new Set([
  // Identity
  "email",
  "password",
  "name",
  "firstname",
  "lastname",
  "fullname",
  "displayname",
  "phone",
  "phonenumber",
  "address",
  "birthdate",
  "dateofbirth",
  // French healthcare
  "nir",
  "ins",
  "rpps",
  // Auth
  "token",
  "accesstoken",
  "refreshtoken",
  "secret",
  "apikey",
  "privatekey",
  // Network
  "ip",
  "ipaddress",
  "useragent",
]);

export function sanitize(obj: unknown, _seen = new WeakSet()): unknown {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (_seen.has(obj)) {
    return "[Circular]";
  }
  _seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item, _seen));
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (PII_FIELDS.has(key.toLowerCase())) {
      result[key] = "[REDACTED]";
    } else {
      result[key] = sanitize(value, _seen);
    }
  }
  return result;
}
