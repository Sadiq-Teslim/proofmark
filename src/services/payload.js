const sequelize = require('../config/db');

// 28-bit payload space (matches the FPWM engine message format).
const MAX_PAYLOAD_ID = (1 << 28) - 1;

// Postgres sequence gives atomic, race-free unique ids.
const ensureSequence = async () => {
  await sequelize.query('CREATE SEQUENCE IF NOT EXISTS payload_seq START 1');
};

const allocateUniquePayload = async () => {
  const [rows] = await sequelize.query("SELECT nextval('payload_seq') AS val");
  const value = parseInt(rows[0].val, 10);
  if (value > MAX_PAYLOAD_ID) throw new Error('Payload space exhausted');
  return value;
};

module.exports = { allocateUniquePayload, ensureSequence, MAX_PAYLOAD_ID };
