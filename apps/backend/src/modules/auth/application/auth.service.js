const {
  buildGoogleOAuthConsentUrl,
  exchangeAuthorizationCodeForTokens,
  getGoogleUserProfile
} = require('../infrastructure/google-oauth.service');
const { saveTokensForUser } = require('../infrastructure/token.repository');
const { logInfo } = require('../../../shared/logging/logger');

function getGoogleAuthRedirectUrl() {
  return buildGoogleOAuthConsentUrl();
}

async function exchangeCodeAndStoreTokens(code) {
  logInfo('Auth service: exchanging authorization code for tokens');
  const tokens = await exchangeAuthorizationCodeForTokens(code);

  logInfo('Auth service: fetching Google user profile');
  const userProfile = await getGoogleUserProfile(tokens.access_token);

  if (!userProfile || !userProfile.sub) {
    throw new Error('Unable to resolve Google user profile id (sub)');
  }

  logInfo('Auth service: saving tokens for user', {
    userId: userProfile.sub,
    hasRefreshToken: Boolean(tokens.refresh_token)
  });
  await saveTokensForUser(userProfile.sub, tokens);

  logInfo('Auth service: token save completed', {
    userId: userProfile.sub
  });

  return {
    userId: userProfile.sub,
    userEmail: userProfile.email || null,
    tokens
  };
}

module.exports = {
  getGoogleAuthRedirectUrl,
  exchangeCodeAndStoreTokens
};
