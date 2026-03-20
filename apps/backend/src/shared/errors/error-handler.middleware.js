const { logError } = require('../logging/logger');

function buildSafeErrorDetails(err) {
  if (err && err.isAxiosError) {
    return {
      name: err.name,
      code: err.code,
      message: err.message,
      status: err.response ? err.response.status : undefined,
      responseData: err.response ? err.response.data : undefined
    };
  }

  return err;
}

function errorHandler(err, req, res, next) {
  logError('Unhandled error in request pipeline', buildSafeErrorDetails(err));

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    message: 'Internal server error'
  });
}

module.exports = {
  errorHandler
};
