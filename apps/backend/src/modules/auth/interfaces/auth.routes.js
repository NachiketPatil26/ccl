const express = require('express');
const {
  redirectToGoogleOAuth,
  handleGoogleOAuthCallback,
  logoutUser
} = require('./auth.controller');

const authRouter = express.Router();

authRouter.get('/google', redirectToGoogleOAuth);
authRouter.get('/callback', handleGoogleOAuthCallback);
authRouter.post('/logout', logoutUser);
authRouter.get('/logout', logoutUser);

module.exports = {
  authRouter
};
