const mongoose = require('mongoose');

// A uniquely-watermarked copy of an asset, issued to one recipient.
// `payload` is the forensic id embedded by FPWM — globally unique for reverse lookup.
const issuanceSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipient', required: true },
  payload: { type: Number, required: true, unique: true, index: true },
  engine: { type: String, default: 'qim-dct' },
  watermarkedUrl: { type: String, required: true },
  watermarkedPublicId: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Issuance', issuanceSchema);
