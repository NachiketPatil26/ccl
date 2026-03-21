const dotenv = require('dotenv');

dotenv.config();

function getRequiredEnvVar(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const env = {
  port: process.env.PORT || 3000,
  googleClientId: getRequiredEnvVar('GOOGLE_CLIENT_ID'),
  googleClientSecret: getRequiredEnvVar('GOOGLE_CLIENT_SECRET'),
  redirectUri: process.env.REDIRECT_URI || 'http://localhost:3000/auth/callback',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean),
  fitDefaultTimezone: process.env.FIT_DEFAULT_TIMEZONE || 'Asia/Kolkata',
  awsRegion: process.env.VITALORB_AWS_REGION || process.env.AWS_REGION || 'ap-south-1',
  tokenTableName: process.env.TOKEN_TABLE_NAME || process.env.DYNAMODB_TABLE || '',
  sessionCookieName: process.env.SESSION_COOKIE_NAME || 'vitalorb_session',
  sessionSecret: process.env.SESSION_SECRET || 'dev-only-change-me',
  nodeEnv: process.env.NODE_ENV || 'development'
};

module.exports = {
  env
};
