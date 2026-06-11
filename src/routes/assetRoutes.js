const express = require('express');
const multer = require('multer');
const { Asset } = require('../models');
const { uploadBuffer } = require('../config/cloudinary');
const { protect } = require('../middleware/auth');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// Upload an original image to protect.
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'image file is required' });
    if (!req.body.title) return res.status(400).json({ message: 'title is required' });

    const { url, publicId } = await uploadBuffer(
      req.file.buffer, 'proofmark/assets', req.file.mimetype
    );
    const asset = await Asset.create({
      userId: req.user.id,
      title: req.body.title,
      originalUrl: url,
      originalPublicId: publicId,
      mimeType: req.file.mimetype,
    });
    res.status(201).json({ asset });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  const assets = await Asset.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
  });
  res.json({ assets });
});

router.get('/:id', protect, async (req, res) => {
  const asset = await Asset.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!asset) return res.status(404).json({ message: 'Asset not found' });
  res.json({ asset });
});

module.exports = router;
