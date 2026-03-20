const crypto = require('crypto');
const { env } = require('../../config/env');

function toBase64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function fromBase64Url(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signPayload(payloadEncoded) {
  return crypto
    .createHmac('sha256', env.sessionSecret)
    .update(payloadEncoded)
    .digest('base64url');
}

function createSessionToken(userId) {
  const payload = {
    userId,
    issuedAt: Date.now()
  };

  const payloadEncoded = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(payloadEncoded);

  return `${payloadEncoded}.${signature}`;
}

function parseSessionToken(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [payloadEncoded, signature] = parts;
  const expectedSignature = signPayload(payloadEncoded);

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    return JSON.parse(fromBase64Url(payloadEncoded));
  } catch (error) {
    return null;
  }
}

function setSessionCookie(res, userId) {
  const sessionToken = createSessionToken(userId);

  res.cookie(env.sessionCookieName, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 7
  });
}

function clearSessionCookie(res) {
  res.clearCookie(env.sessionCookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
    path: '/'
  });
}

function resolveSessionFromRequest(req) {
  const sessionToken = req.cookies ? req.cookies[env.sessionCookieName] : null;
  return parseSessionToken(sessionToken);
}

module.exports = {
  setSessionCookie,
  clearSessionCookie,
  resolveSessionFromRequest
};
