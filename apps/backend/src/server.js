const { app } = require('./app');
const { env } = require('./config/env');
const { logInfo, logError } = require('./shared/logging/logger');

function startServer() {
  app.listen(env.port, () => {
    logInfo(`VitalOrb backend running on http://localhost:${env.port}`);
  });
}

try {
  startServer();
} catch (error) {
  logError('Failed to start server', error);
  process.exit(1);
}
