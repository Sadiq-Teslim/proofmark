const express = require('express');
const axios = require('axios');
const Asset = require('../models/Asset');
const Recipient = require('../models/Recipient');
const Issuance = require('../models/Issuance');
const { uploadBuffer } = require('../config/cloudinary');
const { protect } = require('../middleware/auth');
const fpwm = require('../services/fpwmClient');
const { allocateUniquePayload } = require('../services/payload');

const router = express.Router();

// Issue a uniquely-watermarked copy of an asset to a recipient.
router.post('/', protect, async (req, res) => {
  try {
    const { assetId, recipientId, engine } = req.body;
    if (!assetId || !recipientId) {
      return res.status(400).json({ message: 'assetId and recipientId are required' });
    }
    const asset = await Asset.findOne({ _id: assetId, owner: req.user._id });
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    const recipient = await Recipient.findOne({ _id: recipientId, owner: req.user._id });
    if (!recipient) return res.status(404).json({ message: 'Recipient not found' });

    const payload = await allocateUniquePayload();
    const usedEngine = engine || fpwm.defaultEngine();

    // Fetch the original, watermark it via FPWM, store the marked copy.
    const original = await axios.get(asset.originalUrl, {
      responseType: 'arraybuffer', timeout: 60000,
    });
    const marked = await fpwm.watermarkImage(
      Buffer.from(original.data), 'original', payload, usedEngine
    );
    const up = await uploadBuffer(marked, 'proofmark/issued', 'image/png');

    const issuance = await Issuance.create({
      owner: req.user._id,
      asset: asset._id,
      recipient: recipient._id,
      payload,
      engine: usedEngine,
      watermarkedUrl: up.url,
      watermarkedPublicId: up.publicId,
    });
    const populated = await issuance.populate([
      { path: 'asset', select: 'title' },
      { path: 'recipient', select: 'name email' },
    ]);
    res.status(201).json({ issuance: populated, downloadUrl: up.url });
  } catch (error) {
    res.status(500).json({ message: 'Issuance failed', error: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  const issuances = await Issuance.find({ owner: req.user._id })
    .populate('asset', 'title')
    .populate('recipient', 'name email')
    .sort({ createdAt: -1 });
  res.json({ issuances });
});

module.exports = router;
