const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { authRouter } = require('./modules/auth/interfaces/auth.routes');
const { fitRouter } = require('./modules/fit-ingestion/interfaces/fit.routes');
const { attachSession } = require('./shared/security/session.middleware');
const { errorHandler } = require('./shared/errors/error-handler.middleware');

const app = express();
const frontendDirPath = path.resolve(__dirname, '../../frontend');

app.use(express.json());
app.use(cookieParser());
app.use(attachSession);
app.use(express.static(frontendDirPath));

app.get('/', (req, res) => {
  return res.sendFile(path.join(frontendDirPath, 'home.html'));
});

app.get('/dashboard', (req, res) => {
  return res.sendFile(path.join(frontendDirPath, 'home.html'));
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
