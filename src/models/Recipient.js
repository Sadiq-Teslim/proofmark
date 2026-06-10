const mongoose = require('mongoose');

// Someone a user issues a marked copy to (the traceable party).
const recipientSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, default: '', lowercase: true, trim: true },
  label: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Recipient', recipientSchema);
