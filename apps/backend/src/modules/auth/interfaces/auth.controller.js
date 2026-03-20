const {
  getGoogleAuthRedirectUrl,
  exchangeCodeAndStoreTokens
} = require('../application/auth.service');
const { logInfo } = require('../../../shared/logging/logger');
const { setSessionCookie, clearSessionCookie } = require('../../../shared/security/session');

function redirectToGoogleOAuth(req, res) {
  // Route starts OAuth flow by redirecting user to Google's consent screen.
  const oauthUrl = getGoogleAuthRedirectUrl();

  logInfo('Redirecting user to Google OAuth consent screen');
  res.redirect(oauthUrl);
}

async function handleGoogleOAuthCallback(req, res, next) {
  try {
    // Route receives authorization code after user approves consent.
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        message: 'Authorization code is missing from callback request'
      });
    }

    const authResult = await exchangeCodeAndStoreTokens(code);
    setSessionCookie(res, authResult.userId);

    logInfo('Successfully exchanged authorization code for user', {
      userId: authResult.userId,
      email: authResult.userEmail
    });

    const acceptsHtml = (req.headers.accept || '').includes('text/html');
    if (acceptsHtml) {
      return res.redirect('/dashboard?connected=1');
    }

    return res.status(200).json({
      message: 'Google OAuth successful',
      userId: authResult.userId,
      email: authResult.userEmail,
      scope: authResult.tokens.scope,
      token_type: authResult.tokens.token_type,
      expires_in: authResult.tokens.expires_in
    });
  } catch (error) {
    return next(error);
  }
}

function logoutUser(req, res) {
  clearSessionCookie(res);

  const acceptsHtml = (req.headers.accept || '').includes('text/html');
  if (acceptsHtml) {
    return res.redirect('/');
  }

  return res.status(200).json({
    message: 'Logged out successfully'
  });
}

function getSessionStatus(req, res) {
  const isAuthenticated = Boolean(req.auth && req.auth.userId);

  return res.status(200).json({
    authenticated: isAuthenticated,
    userId: isAuthenticated ? req.auth.userId : null
  });
}

module.exports = {
  redirectToGoogleOAuth,
  handleGoogleOAuthCallback,
  logoutUser,
  getSessionStatus
};
