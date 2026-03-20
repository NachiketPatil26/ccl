const express = require('express');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const { authRouter } = require('./modules/auth/interfaces/auth.routes');
const { fitRouter } = require('./modules/fit-ingestion/interfaces/fit.routes');
const { attachSession } = require('./shared/security/session.middleware');
const { errorHandler } = require('./shared/errors/error-handler.middleware');

const app = express();
const frontendDirPath = path.resolve(__dirname, '../../frontend');
const frontendHomeFilePath = path.join(frontendDirPath, 'home.html');
const frontendAssetsAvailable = fs.existsSync(frontendHomeFilePath);

app.use(express.json());
app.use(cookieParser());
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
