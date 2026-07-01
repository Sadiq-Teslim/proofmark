require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const sequelize = require('./config/db');
require('./models'); // register models + associations
const { ensureSequence } = require('./services/payload');
const { ensureSchemaCompatibility, withSchemaLock } = require('./services/schema');
const { startScanScheduler } = require('./jobs/scanScheduler');
const fpwm = require('./services/fpwmClient');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'proofmark' }));
app.get('/health/fpwm', async (_req, res) => {
  const status = await fpwm.imageConnectionStatus();
  return res.status(status.status === 'ok' ? 200 : 503).json(status);
});
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/images', require('./routes/imageRoutes'));
app.use('/api/videos', require('./routes/videoRoutes'));
app.use('/api/verify', require('./routes/verifyRoutes'));

const PORT = process.env.PORT || 4000;

const start = async () => {
  await sequelize.authenticate();
  await withSchemaLock(async () => {
    // Upgrade legacy tables before sync creates indexes that reference new columns.
    await ensureSchemaCompatibility();
    await sequelize.sync();
    // New tables are created by sync; this second pass is intentionally idempotent.
    await ensureSchemaCompatibility();
    await ensureSequence();
  });
  startScanScheduler(); // web tracker (if a search provider is configured)
  app.listen(PORT, async () => {
    console.log(`ProofMark API on :${PORT}`);
    const fpwmStatus = await fpwm.imageConnectionStatus();
    console.log('FPWM connection status', fpwmStatus);
  });
};

start().catch((error) => {
  console.error('Startup failed:', error.message);
  process.exit(1);
});
