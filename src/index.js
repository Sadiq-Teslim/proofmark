require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'proofmark' }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/assets', require('./routes/assetRoutes'));
app.use('/api/recipients', require('./routes/recipientRoutes'));
app.use('/api/issuances', require('./routes/issuanceRoutes'));
app.use('/api/trace', require('./routes/traceRoutes'));

const PORT = process.env.PORT || 4000;
connectDB()
  .then(() => app.listen(PORT, () => console.log(`ProofMark API on :${PORT}`)))
  .catch((error) => {
    console.error('Startup failed:', error.message);
    process.exit(1);
  });
