const express = require('express');
const axios = require('axios');
const { Asset, Recipient, Issuance } = require('../models');
const { uploadBuffer } = require('../config/cloudinary');
const { protect } = require('../middleware/auth');
const fpwm = require('../services/fpwmClient');
const { allocateUniquePayload } = require('../services/payload');

const router = express.Router();

const includeRefs = [
  { model: Asset, as: 'asset', attributes: ['id', 'title'] },
  { model: Recipient, as: 'recipient', attributes: ['id', 'name', 'email'] },
];

// Issue a uniquely-watermarked copy of an asset to a recipient.
router.post('/', protect, async (req, res) => {
  try {
    const { assetId, recipientId, engine } = req.body;
    if (!assetId || !recipientId) {
      return res.status(400).json({ message: 'assetId and recipientId are required' });
    }
    const asset = await Asset.findOne({ where: { id: assetId, userId: req.user.id } });
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    const recipient = await Recipient.findOne({ where: { id: recipientId, userId: req.user.id } });
    if (!recipient) return res.status(404).json({ message: 'Recipient not found' });

    const payload = await allocateUniquePayload();
    const usedEngine = engine || fpwm.defaultEngine();

    const original = await axios.get(asset.originalUrl, {
      responseType: 'arraybuffer', timeout: 60000,
    });
    const marked = await fpwm.watermarkImage(
      Buffer.from(original.data), 'original', payload, usedEngine
    );
    const up = await uploadBuffer(marked, 'proofmark/issued', 'image/png');

    const created = await Issuance.create({
      userId: req.user.id,
      assetId,
      recipientId,
      payload,
      engine: usedEngine,
      watermarkedUrl: up.url,
      watermarkedPublicId: up.publicId,
    });
    const issuance = await Issuance.findByPk(created.id, { include: includeRefs });
    res.status(201).json({ issuance, downloadUrl: up.url });
  } catch (error) {
    res.status(500).json({ message: 'Issuance failed', error: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  const issuances = await Issuance.findAll({
    where: { userId: req.user.id },
    include: includeRefs,
    order: [['createdAt', 'DESC']],
  });
  res.json({ issuances });
});

module.exports = router;
