const mongoose = require('mongoose');

// An original image a user wants to protect and issue marked copies of.
const assetSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  originalUrl: { type: String, required: true },
  originalPublicId: { type: String, default: '' },
  mimeType: { type: String, default: 'image/png' },
}, { timestamps: true });

module.exports = mongoose.model('Asset', assetSchema);
