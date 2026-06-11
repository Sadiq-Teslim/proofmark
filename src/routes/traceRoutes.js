const express = require('express');
const multer = require('multer');
const { Asset, Recipient, Issuance } = require('../models');
const { protect } = require('../middleware/auth');
const fpwm = require('../services/fpwmClient');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// Trace a suspect image back to the recipient it was issued to.
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'image file is required' });

    const detected = await fpwm.detectImage(req.file.buffer, req.file.originalname, req.body.engine);
    if (!detected.marked || !detected.payload) {
      return res.json({ found: false, detected, message: 'No watermark detected' });
    }

    const issuance = await Issuance.findOne({
      where: { payload: detected.payload, userId: req.user.id },
      include: [
        { model: Asset, as: 'asset', attributes: ['id', 'title', 'originalUrl'] },
        { model: Recipient, as: 'recipient', attributes: ['id', 'name', 'email'] },
      ],
    });

    if (!issuance) {
      return res.json({
        found: true, detected, match: null,
        message: 'Watermark found but not matched to your issuances',
      });
    }

    res.json({
      found: true,
      detected,
      match: {
        payload: issuance.payload,
        recipient: issuance.recipient,
        asset: issuance.asset,
        issuedAt: issuance.createdAt,
        engine: issuance.engine,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Trace failed', error: error.message });
  }
});

module.exports = router;
