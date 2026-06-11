require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const sequelize = require('./config/db');
require('./models'); // register models + associations
const { ensureSequence } = require('./services/payload');
const { startScanScheduler } = require('./jobs/scanScheduler');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'proofmark' }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/images', require('./routes/imageRoutes'));
app.use('/api/verify', require('./routes/verifyRoutes'));

const PORT = process.env.PORT || 4000;

const start = async () => {
  await sequelize.authenticate();
  await sequelize.sync();        // create tables if missing
  await ensureSequence();        // payload id sequence
  startScanScheduler();          // web tracker (if a search provider is configured)
  app.listen(PORT, () => console.log(`ProofMark API on :${PORT}`));
};

start().catch((error) => {
  console.error('Startup failed:', error.message);
  process.exit(1);
});
