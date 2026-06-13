const express = require('express');
const multer = require('multer');
const { Image, Sighting, Verification } = require('../models');
const { uploadBuffer } = require('../config/cloudinary');
const { protect } = require('../middleware/auth');
const fpwm = require('../services/fpwmClient');
const { fetchRemoteImage } = require('../services/remoteImage');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
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

const buildReport = (verification) => {
  const evidence = verification.evidence || {};
  const image = verification.image;
  return [
    '# ProofMark Verification Report',
    '',
    `- Verification ID: ${verification.id}`,
    `- Checked at: ${verification.createdAt.toISOString()}`,
    `- Result: ${verification.result}`,
    `- Source: ${verification.source || 'upload'}`,
    `- Suspect filename: ${verification.suspectFilename || 'N/A'}`,
    `- Suspect URL: ${verification.suspectUrl || 'N/A'}`,
    `- Detected payload: ${verification.detectedPayload || 'None'}`,
    `- Confidence: ${verification.confidence ?? 'Not reported'}`,
    `- Engine: ${verification.engine || 'N/A'}`,
    '',
    '## Matched Property',
    image
      ? `- ${image.title} (${image.id})\n- Payload: ${image.payload}\n- Protected at: ${image.createdAt.toISOString()}`
      : '- No protected property from this account was matched.',
    '',
    '## Attribution Standard',
    evidence.strictAttribution || verification.message,
  ].join('\n');
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
    where: { userId: req.user.id },
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

router.get('/:id/report', protect, async (req, res) => {
  const verification = await Verification.findOne({
    where: { id: req.params.id, userId: req.user.id },
    include: [{
      model: Image,
      as: 'image',
      attributes: publicImageAttributes,
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
