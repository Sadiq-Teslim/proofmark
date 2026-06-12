const express = require('express');
const multer = require('multer');
const { Image, Sighting } = require('../models');
const { uploadBuffer } = require('../config/cloudinary');
const { protect } = require('../middleware/auth');
const fpwm = require('../services/fpwmClient');
const { allocateUniquePayload } = require('../services/payload');
const { scanImage } = require('../services/trackerService');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// Upload an image -> get a watermarked copy back (tied to you).
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'image file is required' });
    if (!req.body.title) return res.status(400).json({ message: 'title is required' });

    const original = await uploadBuffer(req.file.buffer, 'proofmark/originals', req.file.mimetype);
    const payload = await allocateUniquePayload();
    const engine = req.body.engine || fpwm.defaultEngine();

    const marked = await fpwm.watermarkImage(
      req.file.buffer, req.file.originalname, payload, engine
    );
    const wm = await uploadBuffer(marked.buffer, 'proofmark/watermarked', 'image/png');

    const image = await Image.create({
      userId: req.user.id,
      title: req.body.title,
      originalUrl: original.url,
      originalPublicId: original.publicId,
      watermarkedUrl: wm.url,
      watermarkedPublicId: wm.publicId,
      payload,
      engine,
      width: marked.width,
      height: marked.height,
    });
    res.status(201).json({ image });
  } catch (error) {
    res.status(500).json({ message: 'Watermarking failed', error: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  const images = await Image.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
  });
  res.json({ images });
});

router.get('/:id', protect, async (req, res) => {
  const image = await Image.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!image) return res.status(404).json({ message: 'Image not found' });
  res.json({ image });
});

// Trigger a web scan for copies of this image now.
router.post('/:id/scan', protect, async (req, res) => {
  try {
    const image = await Image.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!image) return res.status(404).json({ message: 'Image not found' });
    const result = await scanImage(image);
    res.json({ message: 'Scan complete', ...result });
  } catch (error) {
    res.status(500).json({ message: 'Scan failed', error: error.message });
  }
});

router.get('/:id/sightings', protect, async (req, res) => {
  const image = await Image.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!image) return res.status(404).json({ message: 'Image not found' });
  const sightings = await Sighting.findAll({
    where: { imageId: image.id },
    order: [['confirmed', 'DESC'], ['createdAt', 'DESC']],
  });
  res.json({ sightings });
});

module.exports = router;
