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

  const b64Key = process.env.PRETA_PRIVATE_KEY_B64;
  if (!b64Key) {
    console.error('[preta-token] PRETA_PRIVATE_KEY_B64 env var not set');
    return Response.json({ error: 'server misconfigured' }, { status: 500 });
  }

  const privateKey = Buffer.from(b64Key, 'base64').toString('utf8');

  const token = jwt.sign(claims, privateKey, {
    algorithm: 'RS256',
    expiresIn: '10m',
  });

  return Response.json({ token });
}
