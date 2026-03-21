const express = require('express');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const { env } = require('./config/env');
const { authRouter } = require('./modules/auth/interfaces/auth.routes');
const { fitRouter } = require('./modules/fit-ingestion/interfaces/fit.routes');
const { attachSession } = require('./shared/security/session.middleware');
const { errorHandler } = require('./shared/errors/error-handler.middleware');
const { logInfo } = require('./shared/logging/logger');

const app = express();
const frontendDirPath = path.resolve(__dirname, '../../frontend');
const frontendHomeFilePath = path.join(frontendDirPath, 'home.html');
const frontendAssetsAvailable = fs.existsSync(frontendHomeFilePath);

app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  const origin = (req.headers.origin || '').trim().replace(/\/$/, '');
  const allowedOrigins = new Set((env.corsAllowedOrigins || []).map((value) => value.replace(/\/$/, '')));

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});
app.use((req, res, next) => {
  const requestStart = Date.now();
  logInfo('Incoming request', {
    method: req.method,
    path: req.path,
    origin: req.headers.origin || null,
    hasCookie: Boolean(req.headers.cookie)
  });

  res.on('finish', () => {
    logInfo('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - requestStart
    });
  });

  next();
});
app.use(attachSession);
if (frontendAssetsAvailable) {
  app.use(express.static(frontendDirPath));
}

app.get('/', (req, res) => {
  if (frontendAssetsAvailable) {
    return res.sendFile(frontendHomeFilePath);
  }

  return res.status(200).json({ service: 'vitalorb-backend', message: 'Frontend not bundled in this Lambda artifact' });
});

app.get('/dashboard', (req, res) => {
  if (frontendAssetsAvailable) {
    return res.sendFile(frontendHomeFilePath);
  }

  return res.status(404).json({ message: 'Frontend unavailable in backend deployment' });
});

app.get('/health', (req, res) => {
  return res.status(200).json({ status: 'ok', service: 'vitalorb-backend' });
});

app.use('/auth', authRouter);
app.use('/fit', fitRouter);

app.use(errorHandler);

module.exports = {
  app
};
