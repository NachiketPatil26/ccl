const { resolveSessionFromRequest } = require('./session');
const { logInfo } = require('../logging/logger');

function attachSession(req, res, next) {
  const candidateCookieNames = [
    process.env.SESSION_COOKIE_NAME || 'vitalorb_session',
    'vitalorbsession',
    'vitalorb_session'
  ];
  const hasSessionCookie = Boolean(
    req.cookies && candidateCookieNames.some((cookieName) => Boolean(req.cookies[cookieName]))
  );
  const session = resolveSessionFromRequest(req);

  req.auth = {
    userId: session ? session.userId : null
  };

  logInfo('Session middleware resolved auth state', {
    path: req.path,
    hasSessionCookie,
    authenticated: Boolean(req.auth.userId)
  });

  next();
}

module.exports = {
  attachSession
};
