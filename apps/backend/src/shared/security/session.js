const crypto = require('crypto');
const { env } = require('../../config/env');

const LEGACY_SESSION_COOKIE_NAMES = ['vitalorbsession', 'vitalorb_session'];

function getSessionCookieCandidates() {
  const names = new Set([env.sessionCookieName, ...LEGACY_SESSION_COOKIE_NAMES]);
  return Array.from(names).filter(Boolean);
}

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
  const isProduction = env.nodeEnv === 'production';
  const cookieOptions = {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 7
  };

  for (const cookieName of getSessionCookieCandidates()) {
    if (cookieName !== env.sessionCookieName) {
      res.clearCookie(cookieName, {
        httpOnly: true,
        sameSite: isProduction ? 'none' : 'lax',
        secure: isProduction,
        path: '/'
      });
    }
  }

  res.cookie(env.sessionCookieName, sessionToken, cookieOptions);
}

function clearSessionCookie(res) {
  const isProduction = env.nodeEnv === 'production';

  for (const cookieName of getSessionCookieCandidates()) {
    res.clearCookie(cookieName, {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      path: '/'
    });
  }
}

function resolveSessionFromRequest(req) {
  if (!req.cookies) {
    return null;
  }

  for (const cookieName of getSessionCookieCandidates()) {
    const sessionToken = req.cookies[cookieName];
    const parsed = parseSessionToken(sessionToken);
    if (parsed && parsed.userId) {
      return parsed;
    }
  }

  return null;
}

module.exports = {
  setSessionCookie,
  clearSessionCookie,
  resolveSessionFromRequest
};
