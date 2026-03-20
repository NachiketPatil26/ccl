const { getTokensForUser } = require('../../auth/infrastructure/token.repository');
const { getSteps, getAllMetrics, getGoogleFitParity } = require('../application/fit.service');
const { logInfo } = require('../../../shared/logging/logger');

async function getAccessTokenForRequest(req) {
  const userId = req.auth ? req.auth.userId : null;

  if (!userId) {
    return null;
  }

  const tokens = await getTokensForUser(userId);
  return tokens ? tokens.access_token : null;
}

function getRequestTimezone(req) {
  if (typeof req.query.timezone === 'string' && req.query.timezone.trim()) {
    return req.query.timezone.trim();
  }

  return undefined;
}

function handleFitError(error, res, next) {
  if (error && error.code === 'EMPTY_FIT_DATA') {
    return res.status(404).json({
      message: 'No Google Fit data found for today'
    });
  }

  if (error && error.isAxiosError && error.response && error.response.status === 401) {
    return res.status(401).json({
      message: 'Invalid or expired Google access token'
    });
  }

  return next(error);
}

async function getStepCount(req, res, next) {
  try {
    const accessToken = await getAccessTokenForRequest(req);
    const timeZone = getRequestTimezone(req);

    if (!accessToken) {
      return res.status(401).json({
        message: 'No access token found. Complete /auth/google flow first.'
      });
    }

    const steps = await getSteps(accessToken, { timeZone });

    logInfo('Fetched Google Fit step count successfully');
    return res.status(200).json({ steps });
  } catch (error) {
    return handleFitError(error, res, next);
  }
}

async function getAllHealthMetrics(req, res, next) {
  try {
    const accessToken = await getAccessTokenForRequest(req);
    const timeZone = getRequestTimezone(req);

    if (!accessToken) {
      return res.status(401).json({
        message: 'No access token found. Complete /auth/google flow first.'
      });
    }

    const metrics = await getAllMetrics(accessToken, { timeZone });

    logInfo('Fetched Google Fit health metrics successfully');
    return res.status(200).json(metrics);
  } catch (error) {
    return handleFitError(error, res, next);
  }
}

async function getGoogleFitParityReport(req, res, next) {
  try {
    const accessToken = await getAccessTokenForRequest(req);
    const timeZone = getRequestTimezone(req);

    if (!accessToken) {
      return res.status(401).json({
        message: 'No access token found. Complete /auth/google flow first.'
      });
    }

    const parityReport = await getGoogleFitParity(accessToken, { timeZone });

    logInfo('Generated Google Fit parity report successfully');
    return res.status(200).json(parityReport);
  } catch (error) {
    return handleFitError(error, res, next);
  }
}

module.exports = {
  getStepCount,
  getAllHealthMetrics,
  getGoogleFitParityReport
};
