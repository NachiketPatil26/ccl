const {
  buildGoogleOAuthConsentUrl,
  exchangeAuthorizationCodeForTokens,
  getGoogleUserProfile
} = require('../infrastructure/google-oauth.service');
const { saveTokensForUser } = require('../infrastructure/token.repository');

function getGoogleAuthRedirectUrl() {
  return buildGoogleOAuthConsentUrl();
}

async function exchangeCodeAndStoreTokens(code) {
  const tokens = await exchangeAuthorizationCodeForTokens(code);
  const userProfile = await getGoogleUserProfile(tokens.access_token);

  if (!userProfile || !userProfile.sub) {
    throw new Error('Unable to resolve Google user profile id (sub)');
  }

  await saveTokensForUser(userProfile.sub, tokens);

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
