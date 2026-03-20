const { resolveSessionFromRequest } = require('./session');

function attachSession(req, res, next) {
  const session = resolveSessionFromRequest(req);

  req.auth = {
    userId: session ? session.userId : null
  };

  next();
}

module.exports = {
  attachSession
};
