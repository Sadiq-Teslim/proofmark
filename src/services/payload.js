const Counter = require('../models/Counter');

// 28-bit payload space (matches the FPWM engine message format).
const MAX_PAYLOAD_ID = (1 << 28) - 1;

// Allocate a globally-unique forensic payload id so a detected mark reverse-maps
// to exactly one issuance.
const allocateUniquePayload = async () => {
  const doc = await Counter.findByIdAndUpdate(
    'payload',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  if (doc.seq > MAX_PAYLOAD_ID) throw new Error('Payload space exhausted');
  return doc.seq;
};

module.exports = { allocateUniquePayload, MAX_PAYLOAD_ID };
