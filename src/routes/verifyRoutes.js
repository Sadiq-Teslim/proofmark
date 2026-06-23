const express = require('express');
const multer = require('multer');
const { Op } = require('sequelize');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { Asset, Image, Sighting, Verification, VerificationJob } = require('../models');
const { uploadBuffer, uploadFile } = require('../config/cloudinary');
const { protect } = require('../middleware/auth');
const fpwm = require('../services/fpwmClient');
const { fetchRemoteImage } = require('../services/remoteImage');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});
const maxVideoBytes = () => (
  parseInt(process.env.MAX_VERIFY_VIDEO_UPLOAD_MB || process.env.MAX_VIDEO_UPLOAD_MB || '250', 10)
  * 1024 * 1024
);
const videoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, os.tmpdir()),
    filename: (_req, file, cb) => {
      const suffix = path.extname(file.originalname || '') || '.mp4';
      cb(null, `proofmark-verify-video-${Date.now()}-${Math.random().toString(16).slice(2)}${suffix}`);
    },
  }),
  limits: { fileSize: maxVideoBytes() },
  fileFilter: (_req, file, cb) => {
    if (!/^video\//i.test(file.mimetype || '')) return cb(new Error('video file is required'));
    return cb(null, true);
  },
});

const unique = (items) => [...new Set(items.filter(Boolean))];

const knownImageAttributes = [
  'id',
  'title',
  'watermarkedUrl',
  'payload',
  'engine',
  'width',
  'height',
  'createdAt',
];

const publicImageAttributes = ['id', 'title', 'watermarkedUrl', 'payload', 'engine', 'createdAt'];
const publicAssetAttributes = [
  'id',
  'type',
  'title',
  'protectedUrl',
  'payload',
  'engine',
  'status',
  'durationSeconds',
  'width',
  'height',
  'createdAt',
];

const candidateSizesFor = (knownImages) => unique(
  knownImages
    .filter((image) => image.width && image.height)
    .map((image) => `${image.width}x${image.height}`)
).map((size) => size.split('x').map(Number));

const detectWithKnownEngines = async ({ buffer, filename, knownImages, requestedEngine }) => {
  const candidateSizes = candidateSizesFor(knownImages);
  const engines = requestedEngine
    ? [requestedEngine]
    : unique([...knownImages.map((image) => image.engine), fpwm.defaultEngine()]);

  const errors = [];
  for (const engine of engines) {
    try {
      const detected = await fpwm.detectImage(buffer, filename, engine, candidateSizes);
      if (detected.marked && detected.payload) return detected;
    } catch (error) {
      errors.push(`${engine}: ${error.message}`);
    }
  }

  if (requestedEngine && errors.length === engines.length) {
    const error = new Error(errors.join('; '));
    error.code = 'DETECT_FAILED';
    throw error;
  }

  return {
    marked: false,
    payload: null,
    confidence: 0,
    engine: engines[0] || fpwm.defaultEngine(),
  };
};

const bestEffortEvidenceUpload = async ({ buffer, contentType }) => {
  try {
    const uploaded = await uploadBuffer(buffer, 'proofmark/suspects', contentType || 'image/png');
    return uploaded.url;
  } catch (_) {
    return '';
  }
};

const resultForDetection = (detected, image) => {
  if (!detected.marked || !detected.payload) return 'not_found';
  return image ? 'matched' : 'unknown_owner';
};

const messageForResult = (result) => {
  if (result === 'matched') return 'This image matches one of your protected ProofMark images';
  if (result === 'unknown_owner') {
    return 'A ProofMark watermark was detected, but it is not one of your protected images';
  }
  if (result === 'not_found') return 'No ProofMark watermark detected';
  return 'Verification could not be completed';
};

const evidenceFor = ({ result, detected, image, source, suspectUrl, suspectFilename }) => ({
  result,
  source,
  suspectUrl: suspectUrl || '',
  suspectFilename: suspectFilename || '',
  detected: {
    marked: Boolean(detected.marked),
    payload: detected.payload || null,
    confidence: detected.confidence ?? 0,
    engine: detected.engine || '',
  },
  matchedProperty: image ? {
    id: image.id,
    title: image.title,
    payload: image.payload,
    engine: image.engine,
    protectedAt: image.createdAt,
  } : null,
  strictAttribution: result === 'matched'
    ? 'Valid watermark payload mapped to a protected image owned by this account.'
    : 'ProofMark did not attribute this image to this account.',
});

const recordDirectSighting = async ({ userId, image, url, detected }) => {
  if (!image || !url) return;
  await Sighting.findOrCreate({
    where: { imageId: image.id, pageUrl: url },
    defaults: {
      userId,
      imageUrl: url,
      source: 'direct-url',
      confirmed: true,
      payload: detected.payload,
    },
  });
};

const recordDirectVideoSighting = async ({ userId, asset, url, detected }) => {
  if (!asset || !url) return;
  const existing = await Sighting.findOne({ where: { assetId: asset.id, pageUrl: url } });
  if (existing) {
    existing.confirmed = true;
    existing.payload = detected.payload;
    existing.mediaUrl = url;
    existing.assetType = 'video';
    existing.metadata = {
      ...(existing.metadata || {}),
      confidence: detected.confidence ?? null,
      framesVoted: detected.frames_voted ?? detected.framesVoted ?? null,
      engine: detected.engine || '',
      checkedAt: new Date().toISOString(),
    };
    await existing.save();
    return;
  }

  await Sighting.create({
    userId,
    assetId: asset.id,
    assetType: 'video',
    pageUrl: url,
    mediaUrl: url,
    source: 'direct-video-url',
    confirmed: true,
    payload: detected.payload,
    metadata: {
      confidence: detected.confidence ?? null,
      framesVoted: detected.frames_voted ?? detected.framesVoted ?? null,
      engine: detected.engine || '',
      checkedAt: new Date().toISOString(),
    },
  });
};

const resultForVideoDetection = (detected, asset) => {
  if (!detected.marked || !detected.payload) return 'not_found';
  return asset ? 'matched' : 'unknown_owner';
};

const messageForVideoResult = (result) => {
  if (result === 'matched') return 'This video matches one of your protected ProofMark videos';
  if (result === 'unknown_owner') {
    return 'A ProofMark video watermark was detected, but it is not one of your protected videos';
  }
  if (result === 'not_found') return 'No ProofMark video watermark detected';
  return 'Video verification could not be completed';
};

const evidenceForVideo = ({ result, detected, asset, source, suspectUrl, suspectFilename, engine }) => ({
  result,
  assetType: 'video',
  source,
  suspectUrl: suspectUrl || '',
  suspectFilename: suspectFilename || '',
  detected: {
    marked: Boolean(detected.marked),
    payload: detected.payload || null,
    confidence: detected.confidence ?? 0,
    engine: engine || detected.engine || '',
    framesVoted: detected.frames_voted ?? detected.framesVoted ?? 0,
    audioDetected: Boolean(detected.audio_detected ?? detected.audioDetected),
    audioProbability: detected.audio_probability ?? detected.audioProbability ?? 0,
    audioCorroborated: Boolean(detected.audio_corroborated ?? detected.audioCorroborated),
  },
  matchedProperty: asset ? {
    id: asset.id,
    title: asset.title,
    payload: asset.payload,
    engine: asset.engine,
    protectedAt: asset.createdAt,
    protectedUrl: asset.protectedUrl,
  } : null,
  strictAttribution: result === 'matched'
    ? 'Valid video watermark payload mapped to a protected video owned by this account.'
    : 'ProofMark did not attribute this video to this account.',
});

const createVideoVerification = async ({
  userId,
  source,
  suspectFilename,
  suspectUrl,
  detected,
  asset,
  engine,
}) => {
  const result = resultForVideoDetection(detected, asset);
  const message = messageForVideoResult(result);
  return Verification.create({
    userId,
    assetId: asset?.id || null,
    assetType: 'video',
    source,
    suspectFilename: suspectFilename || '',
    suspectUrl: source === 'url' ? suspectUrl || '' : '',
    suspectMediaUrl: suspectUrl || '',
    result,
    detectedPayload: detected.payload || null,
    confidence: detected.confidence ?? 0,
    engine: engine || detected.engine || '',
    message,
    evidence: evidenceForVideo({
      result,
      detected,
      asset,
      source,
      suspectUrl,
      suspectFilename,
      engine,
    }),
  });
};

const createInvalidVideoVerification = async ({ userId, source, suspectFilename, suspectUrl, engine, error }) => (
  Verification.create({
    userId,
    assetType: 'video',
    source,
    suspectFilename: suspectFilename || '',
    suspectUrl: source === 'url' ? suspectUrl || '' : '',
    suspectMediaUrl: suspectUrl || '',
    result: 'invalid',
    engine: engine || '',
    message: error || 'Video verification could not be completed',
    evidence: {
      result: 'invalid',
      assetType: 'video',
      source,
      suspectUrl: suspectUrl || '',
      suspectFilename: suspectFilename || '',
      error: error || '',
    },
  })
);

const createVerification = async ({
  userId,
  source,
  suspectFilename,
  suspectUrl,
  suspectImageUrl,
  detected,
  image,
}) => {
  const result = resultForDetection(detected, image);
  const message = messageForResult(result);
  return Verification.create({
    userId,
    imageId: image?.id || null,
    source,
    suspectFilename: suspectFilename || '',
    suspectUrl: suspectUrl || '',
    suspectImageUrl: suspectImageUrl || '',
    result,
    detectedPayload: detected.payload || null,
    confidence: detected.confidence ?? 0,
    engine: detected.engine || '',
    message,
    evidence: evidenceFor({ result, detected, image, source, suspectUrl, suspectFilename }),
  });
};

const serializeVerification = (verification, image, detected) => ({
  id: verification.id,
  result: verification.result,
  watermarked: verification.result === 'matched' || verification.result === 'unknown_owner',
  mine: verification.result === 'matched',
  detected,
  message: verification.message,
  evidence: verification.evidence,
  reportUrl: `/verify/${verification.id}/report`,
  match: image || undefined,
});

const serializeVideoVerification = (verification, asset, detected) => ({
  id: verification.id,
  result: verification.result,
  watermarked: verification.result === 'matched' || verification.result === 'unknown_owner',
  mine: verification.result === 'matched',
  detected,
  message: verification.message,
  evidence: verification.evidence,
  reportUrl: `/verify/${verification.id}/report`,
  match: asset || undefined,
});

const buildReport = (verification) => {
  const evidence = verification.evidence || {};
  const image = verification.image;
  const asset = verification.asset;
  const matched = image || asset;
  return [
    '# ProofMark Verification Report',
    '',
    `- Verification ID: ${verification.id}`,
    `- Checked at: ${verification.createdAt.toISOString()}`,
    `- Result: ${verification.result}`,
    `- Asset type: ${verification.assetType || 'image'}`,
    `- Source: ${verification.source || 'upload'}`,
    `- Suspect filename: ${verification.suspectFilename || 'N/A'}`,
    `- Suspect URL: ${verification.suspectUrl || verification.suspectMediaUrl || 'N/A'}`,
    `- Detected payload: ${verification.detectedPayload || 'None'}`,
    `- Confidence: ${verification.confidence ?? 'Not reported'}`,
    `- Engine: ${verification.engine || 'N/A'}`,
    '',
    '## Matched Property',
    matched
      ? `- ${matched.title} (${matched.id})\n- Payload: ${matched.payload}\n- Protected at: ${matched.createdAt.toISOString()}`
      : '- No protected property from this account was matched.',
    '',
    '## Detection Evidence',
    evidence.detected
      ? Object.entries(evidence.detected).map(([key, value]) => `- ${key}: ${value ?? 'N/A'}`).join('\n')
      : '- No detector evidence was reported.',
    '',
    '## Attribution Standard',
    evidence.strictAttribution || verification.message,
  ].join('\n');
};

const completeVideoVerificationJob = async (job) => {
  const existingVerification = job.verificationId
    ? await Verification.findOne({
      where: { id: job.verificationId, userId: job.userId },
      include: [{ model: Asset, as: 'asset', attributes: publicAssetAttributes }],
    })
    : null;
  if (job.status !== 'processing') {
    return {
      job,
      verification: existingVerification
        ? serializeVideoVerification(existingVerification, existingVerification.asset, existingVerification.evidence?.detected || {})
        : null,
    };
  }

  const status = await fpwm.videoDetectJobStatus(job.fpwmJobId);
  if (status.status === 'processing') return { job, verification: null };

  if (status.status === 'error') {
    const verification = await createInvalidVideoVerification({
      userId: job.userId,
      source: job.source,
      suspectFilename: job.suspectFilename,
      suspectUrl: job.suspectUrl,
      engine: job.engine,
      error: status.error || 'Video verification failed',
    });
    job.status = 'error';
    job.error = verification.message;
    job.result = 'invalid';
    job.verificationId = verification.id;
    await job.save();
    return {
      job,
      verification: serializeVideoVerification(verification, null, verification.evidence?.detected || {}),
    };
  }

  const detected = {
    ...(status.result || {}),
    engine: job.engine,
  };
  const asset = detected.marked && detected.payload
    ? await Asset.findOne({
      where: { payload: detected.payload, userId: job.userId, type: 'video' },
      attributes: publicAssetAttributes,
    })
    : null;
  const verification = await createVideoVerification({
    userId: job.userId,
    source: job.source,
    suspectFilename: job.suspectFilename,
    suspectUrl: job.suspectUrl,
    detected,
    asset,
    engine: job.engine,
  });

  if (job.source === 'url' && verification.result === 'matched') {
    await recordDirectVideoSighting({
      userId: job.userId,
      asset,
      url: job.suspectUrl,
      detected,
    });
  }

  job.status = 'ready';
  job.result = verification.result;
  job.detectedPayload = verification.detectedPayload;
  job.confidence = verification.confidence;
  job.assetId = asset?.id || null;
  job.verificationId = verification.id;
  job.evidence = verification.evidence;
  await job.save();
  return {
    job,
    verification: serializeVideoVerification(verification, asset, detected),
  };
};

const runVerification = async ({ req, buffer, filename, contentType, source, suspectUrl }) => {
  const knownImages = await Image.findAll({
    where: { userId: req.user.id },
    attributes: knownImageAttributes,
  });

  const detected = await detectWithKnownEngines({
    buffer,
    filename,
    knownImages,
    requestedEngine: req.body.engine,
  });

  const image = detected.marked && detected.payload
    ? await Image.findOne({
      where: { payload: detected.payload, userId: req.user.id },
      attributes: publicImageAttributes,
    })
    : null;

  const suspectImageUrl = await bestEffortEvidenceUpload({ buffer, contentType });
  const verification = await createVerification({
    userId: req.user.id,
    source,
    suspectFilename: filename,
    suspectUrl,
    suspectImageUrl,
    detected,
    image,
  });

  if (source === 'url' && verification.result === 'matched') {
    await recordDirectSighting({ userId: req.user.id, image, url: suspectUrl, detected });
  }

  return serializeVerification(verification, image, detected);
};

router.get('/', protect, async (req, res) => {
  const verifications = await Verification.findAll({
    where: {
      userId: req.user.id,
      [Op.or]: [{ assetType: 'image' }, { assetType: null }],
    },
    include: [{
      model: Image,
      as: 'image',
      attributes: publicImageAttributes,
    }],
    order: [['createdAt', 'DESC']],
    limit: 20,
  });
  res.json({ verifications });
});

router.get('/video', protect, async (req, res) => {
  const verifications = await Verification.findAll({
    where: { userId: req.user.id, assetType: 'video' },
    include: [{
      model: Asset,
      as: 'asset',
      attributes: publicAssetAttributes,
    }],
    order: [['createdAt', 'DESC']],
    limit: 20,
  });
  res.json({ verifications });
});

router.get('/video/jobs', protect, async (req, res) => {
  try {
    const jobs = await VerificationJob.findAll({
      where: { userId: req.user.id, assetType: 'video' },
      order: [['createdAt', 'DESC']],
      limit: 20,
    });
    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ message: 'Could not load video verification jobs', error: error.message });
  }
});

router.get('/video/jobs/:id', protect, async (req, res) => {
  try {
    const job = await VerificationJob.findOne({
      where: { id: req.params.id, userId: req.user.id, assetType: 'video' },
    });
    if (!job) return res.status(404).json({ message: 'Video verification job not found' });
    return res.json(await completeVideoVerificationJob(job));
  } catch (error) {
    return res.status(500).json({ message: 'Could not refresh video verification job', error: error.message });
  }
});

router.get('/:id/report', protect, async (req, res) => {
  const verification = await Verification.findOne({
    where: { id: req.params.id, userId: req.user.id },
    include: [{
      model: Image,
      as: 'image',
      attributes: publicImageAttributes,
    }, {
      model: Asset,
      as: 'asset',
      attributes: publicAssetAttributes,
    }],
  });
  if (!verification) return res.status(404).json({ message: 'Verification not found' });
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="proofmark-verification-${verification.id}.md"`
  );
  return res.send(buildReport(verification));
});

router.post('/video/url', protect, async (req, res) => {
  try {
    if (!req.body.url) return res.status(400).json({ message: 'url is required' });
    const engine = req.body.engine || fpwm.defaultVideoEngine();
    const engineJob = await fpwm.createDetectVideoJob({
      sourceUrl: req.body.url,
      engine,
    });
    const job = await VerificationJob.create({
      userId: req.user.id,
      assetType: 'video',
      source: 'url',
      suspectUrl: req.body.url,
      engine,
      fpwmJobId: engineJob.job_id,
      status: 'processing',
    });
    return res.status(202).json({ job });
  } catch (error) {
    await createInvalidVideoVerification({
      userId: req.user.id,
      source: 'url',
      suspectUrl: req.body.url || '',
      engine: req.body.engine || fpwm.defaultVideoEngine(),
      error: error.message,
    });
    return res.status(500).json({ message: 'Video verify failed', error: error.message });
  }
});

router.post('/video', protect, videoUpload.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'video file is required' });
    const engine = req.body.engine || fpwm.defaultVideoEngine();
    const suspect = await uploadFile(req.file.path, 'proofmark/videos/suspects', 'video');
    const engineJob = await fpwm.createDetectVideoJob({
      sourceUrl: suspect.url,
      engine,
    });
    const job = await VerificationJob.create({
      userId: req.user.id,
      assetType: 'video',
      source: 'upload',
      suspectFilename: req.file.originalname || '',
      suspectUrl: suspect.url,
      suspectPublicId: suspect.publicId,
      engine,
      fpwmJobId: engineJob.job_id,
      status: 'processing',
    });
    return res.status(202).json({ job });
  } catch (error) {
    try {
      await createInvalidVideoVerification({
        userId: req.user.id,
        source: 'upload',
        suspectFilename: req.file?.originalname || '',
        suspectUrl: '',
        engine: req.body.engine || fpwm.defaultVideoEngine(),
        error: error.message,
      });
    } catch {
      // Preserve original verification error for the API response.
    }
    return res.status(500).json({ message: 'Video verify failed', error: error.message });
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

router.post('/url', protect, async (req, res) => {
  try {
    if (!req.body.url) return res.status(400).json({ message: 'url is required' });
    const remote = await fetchRemoteImage(req.body.url);
    const result = await runVerification({
      req,
      buffer: remote.buffer,
      filename: remote.filename,
      contentType: remote.contentType,
      source: 'url',
      suspectUrl: remote.url,
    });
    return res.json(result);
  } catch (error) {
    await Verification.create({
      userId: req.user.id,
      source: 'url',
      suspectUrl: req.body.url || '',
      result: 'invalid',
      message: error.message,
      evidence: { result: 'invalid', source: 'url', suspectUrl: req.body.url || '' },
    });
    return res.status(500).json({ message: 'Verify failed', error: error.message });
  }
});

// Verify whether an uploaded suspect image is one of your watermarked images.
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'image file is required' });
    const result = await runVerification({
      req,
      buffer: req.file.buffer,
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      source: 'upload',
      suspectUrl: '',
    });
    return res.json(result);
  } catch (error) {
    try {
      await Verification.create({
        userId: req.user.id,
        source: 'upload',
        suspectFilename: req.file?.originalname || '',
        result: 'invalid',
        message: error.message,
        evidence: { result: 'invalid', source: 'upload' },
      });
    } catch {
      // Ignore logging failure so the API can return the original error.
    }
    return res.status(500).json({ message: 'Verify failed', error: error.message });
  }
});

module.exports = router;
