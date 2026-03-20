const express = require('express');
const { getStepCount, getAllHealthMetrics, getGoogleFitParityReport } = require('./fit.controller');

const fitRouter = express.Router();

fitRouter.get('/steps', getStepCount);
fitRouter.get('/metrics', getAllHealthMetrics);
fitRouter.get('/parity', getGoogleFitParityReport);

module.exports = {
  fitRouter
};
