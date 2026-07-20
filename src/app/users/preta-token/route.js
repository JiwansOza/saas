import jwt from 'jsonwebtoken';

export async function GET(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/(^|;\s*)saasify_session=([^;]+)/);

  if (!match) {
    return Response.json({ token: null }, { status: 401 });
  }

  let session;
  try {
    session = JSON.parse(decodeURIComponent(match[2]));
  } catch {
    return Response.json({ token: null }, { status: 400 });
  }

  const claims = session.pretaUser || {};

  if (!claims || Object.keys(claims).length === 0) {
    return Response.json({ token: null }, { status: 401 });
  }

  // Accept the private key as base64 (PRETA_PRIVATE_KEY_B64) OR as a raw PEM
  // (PRETA_PRIVATE_KEY). Handles escaped newlines that env vars often introduce.
  const b64Key = process.env.PRETA_PRIVATE_KEY_B64;
  const rawKey = process.env.PRETA_PRIVATE_KEY;
  let privateKey;
  if (b64Key) {
    privateKey = Buffer.from(b64Key, 'base64').toString('utf8');
  } else if (rawKey) {
    privateKey = rawKey.includes('BEGIN')
      ? rawKey.replace(/\\n/g, '\n')                    // raw PEM (un-escape newlines)
      : Buffer.from(rawKey, 'base64').toString('utf8'); // base64 stored without the _B64 name
  } else {
    console.error('[preta-token] No private key set (PRETA_PRIVATE_KEY_B64 or PRETA_PRIVATE_KEY)');
    return Response.json({ error: 'server misconfigured' }, { status: 500 });
  }

  const token = jwt.sign(claims, privateKey, {
    algorithm: 'RS256',
    expiresIn: '10m',
  });

  return Response.json({ token });
}
