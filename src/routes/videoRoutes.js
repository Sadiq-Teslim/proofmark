const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { Asset, ProtectionJob, Sighting, Verification } = require('../models');
const { uploadFile } = require('../config/cloudinary');
const { protect } = require('../middleware/auth');
const fpwm = require('../services/fpwmClient');
const { allocateUniquePayload } = require('../services/payload');

const router = express.Router();

const maxVideoBytes = () => (
  parseInt(process.env.MAX_VIDEO_UPLOAD_MB || '250', 10) * 1024 * 1024
);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, os.tmpdir()),
    filename: (_req, file, cb) => {
      const suffix = path.extname(file.originalname || '') || '.mp4';
      cb(null, `proofmark-video-${Date.now()}-${Math.random().toString(16).slice(2)}${suffix}`);
    },
  }),
  limits: { fileSize: maxVideoBytes() },
  fileFilter: (_req, file, cb) => {
    if (!/^video\//i.test(file.mimetype || '')) {
      return cb(new Error('video file is required'));
    }
    return cb(null, true);
  },
});

const publicVideoAttributes = [
  'id',
  'type',
  'title',
  'originalUrl',
  'protectedUrl',
  'payload',
  'engine',
  'status',
  'error',
  'sourceFilename',
  'mimeType',
  'width',
  'height',
  'durationSeconds',
  'fps',
  'metadata',
  'createdAt',
  'updatedAt',
];

const publicVerificationAttributes = [
  'id',
  'assetType',
  'source',
  'suspectFilename',
  'suspectUrl',
  'suspectMediaUrl',
  'result',
  'detectedPayload',
  'confidence',
  'engine',
  'message',
  'evidence',
  'createdAt',
];

const serializeVideo = (asset) => asset ? {
  id: asset.id,
  type: asset.type,
  title: asset.title,
  originalUrl: asset.originalUrl,
  protectedUrl: asset.protectedUrl,
  payload: asset.payload,
  engine: asset.engine,
  status: asset.status,
  error: asset.error,
  sourceFilename: asset.sourceFilename,
  mimeType: asset.mimeType,
  width: asset.width,
  height: asset.height,
  durationSeconds: asset.durationSeconds,
  fps: asset.fps,
  metadata: asset.metadata || {},
  createdAt: asset.createdAt,
  updatedAt: asset.updatedAt,
} : null;

const completeProtectionJob = async (job) => {
  const asset = await Asset.findOne({
    where: { id: job.assetId, userId: job.userId, type: 'video' },
  });
  if (!asset) return { job, video: null };
  if (job.status !== 'processing') return { job, video: serializeVideo(asset) };

  const status = await fpwm.videoWatermarkJobStatus(job.fpwmJobId);
  if (status.status === 'processing') return { job, video: serializeVideo(asset) };

  if (status.status === 'error') {
    job.status = 'error';
    job.error = status.error || 'Video protection failed';
    asset.status = 'error';
    asset.error = job.error;
    await Promise.all([job.save(), asset.save()]);
    return { job, video: serializeVideo(asset) };
  }

  if (!status.watermarked_url) {
    job.status = 'error';
    job.error = 'Video protection finished without a protected video URL';
    asset.status = 'error';
    asset.error = job.error;
    await Promise.all([job.save(), asset.save()]);
    return { job, video: serializeVideo(asset) };
  }

  asset.status = 'ready';
  asset.protectedUrl = status.watermarked_url;
  asset.metadata = {
    ...(asset.metadata || {}),
    fpwmJobId: status.job_id,
    metrics: status.metrics || {},
  };
  job.status = 'ready';
  job.watermarkedUrl = asset.protectedUrl;
  job.metadata = {
    ...(job.metadata || {}),
    metrics: status.metrics || {},
  };
  await Promise.all([asset.save(), job.save()]);
  return { job, video: serializeVideo(asset) };
};

router.post('/', protect, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'video file is required' });
    if (!req.body.title) return res.status(400).json({ message: 'title is required' });

    const original = await uploadFile(req.file.path, 'proofmark/videos/originals', 'video');
    const payload = await allocateUniquePayload();
    const engine = req.body.engine || fpwm.defaultVideoEngine();

    const asset = await Asset.create({
      userId: req.user.id,
      type: 'video',
      title: req.body.title,
      originalUrl: original.url,
      originalPublicId: original.publicId,
      payload,
      engine,
      status: 'processing',
      sourceFilename: req.file.originalname || '',
      mimeType: req.file.mimetype || '',
      width: original.width,
      height: original.height,
      durationSeconds: original.duration,
      metadata: {
        source: 'proofmark-upload',
        storage: 'cloudinary',
      },
    });

    const engineJob = await fpwm.createWatermarkVideoJob({
      sourceUrl: original.url,
      payload,
      engine,
      strength: req.body.strength ? Number(req.body.strength) : null,
      idempotencyKey: `proofmark-video-${asset.id}`,
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
      assetType: 'video',
      durationSeconds: original.duration,
      metadata: {
        assetType: 'video',
        sourceMimeType: req.file.mimetype || '',
      },
    });

    return res.status(202).json({ job, video: serializeVideo(asset) });
  } catch (error) {
    return res.status(500).json({ message: 'Video protection failed', error: error.message });
  } finally {
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (_) {
        // Temp-file cleanup is best-effort.
      }
    }
  }
});

router.get('/jobs', protect, async (req, res) => {
  try {
    const jobs = await ProtectionJob.findAll({
      where: { userId: req.user.id, assetType: 'video' },
      order: [['createdAt', 'DESC']],
      limit: 20,
    });
    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ message: 'Could not load video protection jobs', error: error.message });
  }
});

router.get('/jobs/:id', protect, async (req, res) => {
  try {
    const job = await ProtectionJob.findOne({
      where: { id: req.params.id, userId: req.user.id, assetType: 'video' },
    });
    if (!job) return res.status(404).json({ message: 'Video protection job not found' });
    return res.json(await completeProtectionJob(job));
  } catch (error) {
    return res.status(500).json({ message: 'Could not refresh video protection job', error: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const videos = await Asset.findAll({
      where: { userId: req.user.id, type: 'video' },
      attributes: publicVideoAttributes,
      order: [['createdAt', 'DESC']],
    });
    res.json({ videos: videos.map(serializeVideo) });
  } catch (error) {
    res.status(500).json({ message: 'Could not load videos', error: error.message });
  }
});

router.get('/sightings', protect, async (req, res) => {
  try {
    const sightings = await Sighting.findAll({
      where: { userId: req.user.id, assetType: 'video' },
      include: [{ model: Asset, as: 'asset', attributes: publicVideoAttributes }],
      order: [['confirmed', 'DESC'], ['createdAt', 'DESC']],
      limit: 200,
    });
    res.json({ sightings });
  } catch (error) {
    res.status(500).json({ message: 'Could not load video sightings', error: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  const video = await Asset.findOne({
    where: { id: req.params.id, userId: req.user.id, type: 'video' },
    attributes: publicVideoAttributes,
  });
  if (!video) return res.status(404).json({ message: 'Video not found' });
  return res.json({ video: serializeVideo(video) });
});

router.get('/:id/evidence', protect, async (req, res) => {
  try {
    const video = await Asset.findOne({
      where: { id: req.params.id, userId: req.user.id, type: 'video' },
      attributes: publicVideoAttributes,
    });
    if (!video) return res.status(404).json({ message: 'Video not found' });

    const [sightings, verifications] = await Promise.all([
      Sighting.findAll({
        where: { assetId: video.id, userId: req.user.id, assetType: 'video' },
        order: [['confirmed', 'DESC'], ['createdAt', 'DESC']],
      }),
      Verification.findAll({
        where: { assetId: video.id, userId: req.user.id, assetType: 'video' },
        attributes: publicVerificationAttributes,
        order: [['createdAt', 'DESC']],
      }),
    ]);

    return res.json({ video: serializeVideo(video), sightings, verifications });
  } catch (error) {
    return res.status(500).json({ message: 'Could not load video evidence', error: error.message });
  }
});

router.get('/:id/sightings', protect, async (req, res) => {
  const video = await Asset.findOne({
    where: { id: req.params.id, userId: req.user.id, type: 'video' },
  });
  if (!video) return res.status(404).json({ message: 'Video not found' });
  const sightings = await Sighting.findAll({
    where: { assetId: video.id, userId: req.user.id, assetType: 'video' },
    order: [['confirmed', 'DESC'], ['createdAt', 'DESC']],
  });
  return res.json({ sightings });
});

router.get('/:id/download', protect, async (req, res) => {
  try {
    const video = await Asset.findOne({
      where: { id: req.params.id, userId: req.user.id, type: 'video' },
    });
    if (!video) return res.status(404).json({ message: 'Video not found' });
    if (video.status !== 'ready' || !video.protectedUrl) {
      return res.status(409).json({ message: 'Protected video is not ready yet' });
    }

    const response = await axios.get(video.protectedUrl, {
      responseType: 'stream',
      timeout: 120000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    const filename = `${video.title || 'proofmark-video'}-proofmark.mp4`
      .replace(/[^a-z0-9._-]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();

    res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp4');
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'proofmark-video.mp4'}"`);
    return response.data.pipe(res);
  } catch (error) {
    return res.status(500).json({ message: 'Download failed', error: error.message });
  }
});

module.exports = router;
