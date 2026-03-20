const axios = require('axios');
const { env } = require('../../../config/env');

const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
const GOOGLE_FIT_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.body.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read'
];

function buildGoogleOAuthConsentUrl() {
  // Step 1: Build Google OAuth consent URL with Fit scopes and offline access.
  const queryParams = new URLSearchParams({
    client_id: env.googleClientId,
    redirect_uri: env.redirectUri,
    response_type: 'code',
    access_type: 'offline',
    scope: GOOGLE_FIT_SCOPES.join(' '),
    prompt: 'consent'
  });

  return `${GOOGLE_OAUTH_URL}?${queryParams.toString()}`;
}

async function exchangeAuthorizationCodeForTokens(code) {
  // Step 2: Exchange one-time authorization code for access + refresh tokens.
  const requestBody = new URLSearchParams({
    code,
    client_id: env.googleClientId,
    client_secret: env.googleClientSecret,
    redirect_uri: env.redirectUri,
    grant_type: 'authorization_code'
  });

  const response = await axios.post(GOOGLE_TOKEN_URL, requestBody.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  return response.data;
}

async function getGoogleUserProfile(accessToken) {
  const response = await axios.get(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  return response.data;
}

module.exports = {
  buildGoogleOAuthConsentUrl,
  exchangeAuthorizationCodeForTokens,
  getGoogleUserProfile
};
