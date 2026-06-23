const express = require('express');
const multer = require('multer');
const axios = require('axios');
const { Asset, Image, ProtectionJob, Sighting } = require('../models');
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

router.get('/capabilities', protect, async (_req, res) => {
  try {
    const capabilities = await fpwm.imageCapabilities();
    res.json({ capabilities });
  } catch (error) {
    res.status(500).json({
      message: 'Could not load watermark capabilities',
      error: error.message,
    });
  }
});

const completeProtectionJob = async (job) => {
  if (job.status !== 'processing') {
    const image = job.imageId
      ? await Image.findOne({ where: { id: job.imageId, userId: job.userId } })
      : null;
    return { job, image };
  }

  const status = await fpwm.imageWatermarkJobStatus(job.fpwmJobId);
  if (status.status === 'processing') return { job, image: null };

  if (status.status === 'error') {
    job.status = 'error';
    job.error = status.error || 'Strong protection failed';
    await job.save();
    return { job, image: null };
  }

  const result = status.result || {};
  const image = await Image.create({
    userId: job.userId,
    title: job.title,
    originalUrl: job.originalUrl,
    originalPublicId: job.originalPublicId,
    watermarkedUrl: result.watermarked_url,
    watermarkedPublicId: result.watermarked_public_id || '',
    payload: job.payload,
    engine: job.engine,
    width: result.width || null,
    height: result.height || null,
    assetId: job.assetId || null,
  });
  if (job.assetId) {
    const asset = await Asset.findOne({ where: { id: job.assetId, userId: job.userId } });
    if (asset) {
      asset.status = 'ready';
      asset.protectedUrl = result.watermarked_url;
      asset.protectedPublicId = result.watermarked_public_id || '';
      asset.width = result.width || null;
      asset.height = result.height || null;
      asset.metadata = {
        ...(asset.metadata || {}),
        imageId: image.id,
        fpwmJobId: status.job_id || job.fpwmJobId,
      };
      await asset.save();
    }
  }
  job.status = 'ready';
  job.imageId = image.id;
  job.watermarkedUrl = image.watermarkedUrl;
  job.watermarkedPublicId = image.watermarkedPublicId;
  job.width = image.width;
  job.height = image.height;
  await job.save();
  return { job, image };
};

// Upload an image -> get a watermarked copy back (tied to you).
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'image file is required' });
    if (!req.body.title) return res.status(400).json({ message: 'title is required' });

    const original = await uploadBuffer(req.file.buffer, 'proofmark/originals', req.file.mimetype);
    const payload = await allocateUniquePayload();
    const engine = req.body.engine || fpwm.defaultEngine();
    const capabilities = await fpwm.imageCapabilities();
    if (engine === 'trustmark' && !capabilities.engines?.trustmark?.available) {
      return res.status(409).json({
        message: 'Strong protection is not available yet. Enable TrustMark in the watermark engine and pass the strong-mode benchmark before using it.',
        capabilities,
      });
    }

    if (engine === 'trustmark') {
      const engineJob = await fpwm.createWatermarkImageJob(
        req.file.buffer, req.file.originalname, payload, engine
      );
      const asset = await Asset.create({
        userId: req.user.id,
        type: 'image',
        title: req.body.title,
        originalUrl: original.url,
        originalPublicId: original.publicId,
        payload,
        engine,
        status: 'processing',
        sourceFilename: req.file.originalname || '',
        mimeType: req.file.mimetype || '',
        metadata: {
          source: 'proofmark-upload',
          storage: 'cloudinary',
        },
      });
      const job = await ProtectionJob.create({
        userId: req.user.id,
        title: req.body.title,
        originalUrl: original.url,
        originalPublicId: original.publicId,
        sourceFilename: req.file.originalname || '',
        payload,
        engine,
        fpwmJobId: engineJob.job_id,
        status: 'processing',
        assetId: asset.id,
        assetType: 'image',
      });
      return res.status(202).json({ job });
    }

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
    const asset = await Asset.create({
      userId: req.user.id,
      type: 'image',
      title: image.title,
      originalUrl: image.originalUrl,
      originalPublicId: image.originalPublicId,
      protectedUrl: image.watermarkedUrl,
      protectedPublicId: image.watermarkedPublicId,
      payload: image.payload,
      engine: image.engine,
      status: 'ready',
      sourceFilename: req.file.originalname || '',
      mimeType: req.file.mimetype || '',
      width: image.width,
      height: image.height,
      metadata: {
        source: 'proofmark-upload',
        storage: 'cloudinary',
        imageId: image.id,
      },
    });
    image.assetId = asset.id;
    await image.save();
    res.status(201).json({ image });
  } catch (error) {
    res.status(500).json({ message: 'Watermarking failed', error: error.message });
  }
});

router.get('/jobs', protect, async (req, res) => {
  try {
    const jobs = await ProtectionJob.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 20,
    });
    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ message: 'Could not load protection jobs', error: error.message });
  }
});

router.get('/jobs/:id', protect, async (req, res) => {
  try {
    const job = await ProtectionJob.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!job) return res.status(404).json({ message: 'Protection job not found' });
    const result = await completeProtectionJob(job);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Could not refresh protection job', error: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const images = await Image.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json({ images });
  } catch (error) {
    res.status(500).json({ message: 'Could not load images', error: error.message });
  }
});

// All sightings for the user across every property (powers Tracking + Overview).
router.get('/sightings', protect, async (req, res) => {
  try {
    const sightings = await Sighting.findAll({
      where: { userId: req.user.id },
      include: [{ model: Image, as: 'image', attributes: ['id', 'title', 'watermarkedUrl', 'payload'] }],
      order: [['confirmed', 'DESC'], ['createdAt', 'DESC']],
      limit: 200,
    });
    res.json({ sightings });
  } catch (error) {
    res.status(500).json({ message: 'Could not load sightings', error: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  const image = await Image.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!image) return res.status(404).json({ message: 'Image not found' });
  res.json({ image });
});

router.get('/:id/download', protect, async (req, res) => {
  try {
    const image = await Image.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!image) return res.status(404).json({ message: 'Image not found' });

    const response = await axios.get(image.watermarkedUrl, {
      responseType: 'arraybuffer',
      timeout: 60000,
      maxContentLength: 30 * 1024 * 1024,
      maxBodyLength: 30 * 1024 * 1024,
    });
    const filename = `${image.title || 'proofmark-image'}-proofmark.png`
      .replace(/[^a-z0-9._-]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();

    res.setHeader('Content-Type', response.headers['content-type'] || 'image/png');
    res.setHeader('Content-Length', Buffer.byteLength(response.data));
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'proofmark-image.png'}"`);
    return res.send(Buffer.from(response.data));
  } catch (error) {
    return res.status(500).json({ message: 'Download failed', error: error.message });
  }
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
