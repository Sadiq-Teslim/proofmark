const express = require('express');
const multer = require('multer');
const { Image } = require('../models');
const { protect } = require('../middleware/auth');
const fpwm = require('../services/fpwmClient');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// Verify whether a suspect image is one of your watermarked images.
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'image file is required' });

    // Size hints: the distinct original dimensions of this user's registered images let
    // the engine undo platform resizes (Instagram/Twitter/WhatsApp pipelines).
    const sized = await Image.findAll({
      where: { userId: req.user.id },
      attributes: ['width', 'height'],
    });
    const candidateSizes = [...new Set(
      sized.filter((i) => i.width && i.height).map((i) => `${i.width}x${i.height}`)
    )].map((s) => s.split('x').map(Number));

    const detected = await fpwm.detectImage(
      req.file.buffer, req.file.originalname, req.body.engine, candidateSizes
    );
    if (!detected.marked || !detected.payload) {
      return res.json({ watermarked: false, message: 'No ProofMark watermark detected' });
    }

    const image = await Image.findOne({ where: { payload: detected.payload, userId: req.user.id } });
    if (!image) {
      return res.json({
        watermarked: true, mine: false, detected,
        message: 'A watermark was detected, but not one of your images',
      });
    }

    res.json({
      watermarked: true,
      mine: true,
      detected,
      match: {
        id: image.id,
        title: image.title,
        watermarkedUrl: image.watermarkedUrl,
        payload: image.payload,
        createdAt: image.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Verify failed', error: error.message });
  }
});

module.exports = router;
