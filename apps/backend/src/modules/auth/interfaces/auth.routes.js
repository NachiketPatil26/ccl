const express = require('express');
const {
  redirectToGoogleOAuth,
  handleGoogleOAuthCallback,
  logoutUser,
  getSessionStatus
} = require('./auth.controller');

const authRouter = express.Router();

authRouter.get('/google', redirectToGoogleOAuth);
authRouter.get('/callback', handleGoogleOAuthCallback);
authRouter.get('/session', getSessionStatus);
authRouter.post('/logout', logoutUser);
authRouter.get('/logout', logoutUser);

module.exports = {
  authRouter
};
