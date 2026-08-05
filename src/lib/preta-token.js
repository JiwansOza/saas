// Signs a short-lived Preta context JWT server-side (RS256) so the loader can read it
// synchronously from window.__PRETA_CTX__ (data-ctx-var) — NO client fetch to the
// onrender backend, so the expiring saasify_access_token can never cause a 401 that
// hides the personalized element. Preta verifies the token with the matching PUBLIC key
// registered for this SaaSify company in the dashboard (Sign the context JWT → paste key).
import { SignJWT, importPKCS8 } from "jose";

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
