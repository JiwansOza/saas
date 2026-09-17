// Signs a short-lived Preta context JWT server-side (RS256) so the loader can read it
// synchronously from window.__PRETA_CTX__ (data-ctx-var) — NO client fetch to the
// onrender backend, so the expiring saasify_access_token can never cause a 401 that
// hides the personalized element. Preta verifies the token with the matching PUBLIC key
// registered for this SaaSify company in the dashboard (Sign the context JWT → paste key).
import { SignJWT, importPKCS8 } from "jose";
import { createHmac } from "node:crypto";

// Keys the opaque `uid`. Same algorithm and secret as saas-backend's pretaUid(), so one user
// gets one uid whichever of our apps signs the token. Never change it once set: every user's
// rollout bucket would move.
const UID_SECRET = process.env.PRETA_UID_SECRET || null;

/**
 * The ONLY user data that leaves for Preta — built server-side from the session cookie.
 *
 * Allow-list, not a spread: the session carries our raw database id (and test logins add a
 * name), and neither is Preta's business. The id is turned into `uid`, an HMAC Preta cannot
 * reverse, which it uses to keep one person on the same side of a rollout on every device.
 * No secret configured → no uid (Preta falls back to a per-browser id); the raw id still
 * never goes out.
 */
export function pretaClaims(sessionUser) {
  if (!sessionUser || typeof sessionUser !== "object") return null;
  const { plan, role, has_paid, billing_status, risk_score } = sessionUser;
  const claims = { plan, role, has_paid, billing_status, risk_score };
  if (UID_SECRET && sessionUser.id) {
    claims.uid = "u_" + createHmac("sha256", UID_SECRET).update(String(sessionUser.id)).digest("hex").slice(0, 32);
  }
  for (const k of Object.keys(claims)) if (claims[k] === undefined) delete claims[k];
  return claims;
}

// PEM may be stored raw (with BEGIN header, \n escaped) or base64 in the env.
function decodePem(value) {
  if (!value) return null;
  if (value.includes("BEGIN")) return value.replace(/\\n/g, "\n");
  return Buffer.from(value, "base64").toString("utf8");
}

const PRIVATE_PEM = decodePem(process.env.PRETA_PRIVATE_KEY);

let privateKeyPromise;
function getPrivateKey() {
  if (!PRIVATE_PEM) throw new Error("PRETA_PRIVATE_KEY is not set");
  if (!privateKeyPromise) privateKeyPromise = importPKCS8(PRIVATE_PEM, "RS256");
  return privateKeyPromise;
}

/**
 * Create the signed context token consumed by the Preta SDK via
 * window.__PRETA_CTX__ + data-ctx-var. The edge verifies only the SIGNATURE
 * (against the company's registered public key), so we just carry the user
 * attributes under the preta:user namespace — plan is what the rules target.
 * @param {{plan?:string, role?:string, has_paid?:boolean, risk_score?:number, billing_status?:string, [k:string]:any}} ctx
 * @param {{ttlSeconds?:number}} [opts]
 */
export async function createPretaContextToken(ctx, opts = {}) {
  const key = await getPrivateKey();
  const ttl = opts.ttlSeconds ?? 300; // 5 minutes — re-signed on every page load anyway
  return await new SignJWT({ "preta:user": { ...ctx } })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(key);
}
