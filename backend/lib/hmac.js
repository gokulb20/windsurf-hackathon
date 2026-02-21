const crypto = require("crypto");

const HMAC_SECRET = process.env.HMAC_SECRET;

if (!HMAC_SECRET) {
  console.warn("WARNING: HMAC_SECRET not set — receipt signing will fail");
}

/**
 * Build the canonical payload string for HMAC signing.
 * Fields are sorted alphabetically and joined with pipes.
 */
function buildCanonicalPayload(fields) {
  const keys = Object.keys(fields).sort();
  return keys.map((k) => `${k}=${fields[k]}`).join("|");
}

/**
 * Generate an HMAC-SHA256 signature for the given fields object.
 */
function signReceipt(fields) {
  const canonical = buildCanonicalPayload(fields);
  const hmac = crypto.createHmac("sha256", HMAC_SECRET);
  hmac.update(canonical);
  return { signature: hmac.digest("hex"), canonical };
}

/**
 * Verify an HMAC-SHA256 signature against the given fields object.
 */
function verifyReceipt(fields, signature) {
  const { signature: expected } = signReceipt(fields);
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(signature, "hex")
  );
}

module.exports = { signReceipt, verifyReceipt, buildCanonicalPayload };
