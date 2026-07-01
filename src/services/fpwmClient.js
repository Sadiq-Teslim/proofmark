const axios = require('axios');
const FormData = require('form-data');

const baseUrl = () => {
  if (!process.env.FPWM_BASE_URL) throw new Error('FPWM_BASE_URL is required');
  return process.env.FPWM_BASE_URL.replace(/\/$/, '');
};

const authHeader = () => {
  if (!process.env.FPWM_API_KEY) throw new Error('FPWM_API_KEY is required');
  return `Bearer ${process.env.FPWM_API_KEY}`;
};

const defaultEngine = () => process.env.FPWM_IMAGE_ENGINE || 'qim-dct';
const defaultVideoEngine = () => process.env.FPWM_VIDEO_ENGINE || 'qim-dct';
const maxPayload = () => parseInt(process.env.FPWM_MAX_PAYLOAD || '268435455', 10);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isTransientDetectionError = (error) => {
  const status = error.response?.status;
  return (
    !error.response
    || [408, 425, 429].includes(status)
    || status >= 500
  );
};

const imageCapabilities = async () => {
  try {
    const res = await axios.get(`${baseUrl()}/v1/image/capabilities`, {
      headers: { Authorization: authHeader() },
      timeout: parseInt(process.env.FPWM_CAPABILITIES_TIMEOUT_MS || '60000', 10),
    });
    return { ...res.data, source: 'engine' };
  } catch (error) {
    return {
      default_engine: defaultEngine(),
      source: 'fallback',
      available: false,
      upstream_status: error.response?.status || null,
      error: error.response?.data?.detail || error.message,
      engines: {
        'qim-dct': { available: false, tier: 'standard' },
        trustmark: {
          available: false,
          tier: 'strong',
        },
      },
    };
  }
};

// Embed a payload into image bytes.
// Returns { buffer, width, height } — dims come from the engine so they can be stored
// and passed back as size hints at detection time.
const watermarkImage = async (buffer, filename, payload, engine = defaultEngine()) => {
  const form = new FormData();
  form.append('file', buffer, { filename: filename || 'image' });
  form.append('payload', String(payload));
  form.append('engine', engine);

  const res = await axios.post(`${baseUrl()}/v1/image/watermark`, form, {
    headers: { Authorization: authHeader(), ...form.getHeaders() },
    responseType: 'arraybuffer',
    timeout: 120000,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });
  return {
    buffer: Buffer.from(res.data),
    width: parseInt(res.headers['x-original-width'], 10) || null,
    height: parseInt(res.headers['x-original-height'], 10) || null,
  };
};

const createWatermarkImageJob = async (buffer, filename, payload, engine = defaultEngine()) => {
  const form = new FormData();
  form.append('file', buffer, { filename: filename || 'image' });
  form.append('payload', String(payload));
  form.append('engine', engine);

  const res = await axios.post(`${baseUrl()}/v1/image/watermark/jobs`, form, {
    headers: { Authorization: authHeader(), ...form.getHeaders() },
    timeout: 120000,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });
  return res.data;
};

const imageWatermarkJobStatus = async (jobId) => {
  const res = await axios.get(`${baseUrl()}/v1/image/watermark/jobs/${jobId}`, {
    headers: { Authorization: authHeader() },
    timeout: 60000,
  });
  return res.data;
};

const createWatermarkVideoJob = async ({
  sourceUrl,
  payload,
  engine = defaultVideoEngine(),
  strength = null,
  callbackUrl = null,
  idempotencyKey = null,
}) => {
  const body = {
    source_url: sourceUrl,
    payload,
    max_payload: maxPayload(),
    engine,
  };
  if (strength) body.strength = strength;
  if (callbackUrl) body.callback_url = callbackUrl;
  if (idempotencyKey) body.idempotency_key = idempotencyKey;

  const res = await axios.post(`${baseUrl()}/v1/watermark/video`, body, {
    headers: { Authorization: authHeader() },
    timeout: parseInt(process.env.FPWM_VIDEO_JOB_TIMEOUT_MS || '120000', 10),
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });
  return res.data;
};

const videoWatermarkJobStatus = async (jobId) => {
  const res = await axios.get(`${baseUrl()}/v1/watermark/jobs/${jobId}`, {
    headers: { Authorization: authHeader() },
    timeout: parseInt(process.env.FPWM_VIDEO_STATUS_TIMEOUT_MS || '60000', 10),
  });
  return res.data;
};

const createDetectVideoJob = async ({
  sourceUrl,
  engine = defaultVideoEngine(),
}) => {
  const res = await axios.post(`${baseUrl()}/v1/detect/video`, {
    source_url: sourceUrl,
    max_payload: maxPayload(),
    engine,
  }, {
    headers: { Authorization: authHeader() },
    timeout: parseInt(process.env.FPWM_VIDEO_JOB_TIMEOUT_MS || '120000', 10),
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });
  return res.data;
};

const videoDetectJobStatus = async (jobId) => {
  const res = await axios.get(`${baseUrl()}/v1/detect/jobs/${jobId}`, {
    headers: { Authorization: authHeader() },
    timeout: parseInt(process.env.FPWM_VIDEO_STATUS_TIMEOUT_MS || '60000', 10),
  });
  return res.data;
};

// Detect a payload in image bytes; returns { marked, payload, confidence, engine }.
// candidateSizes: [[w,h],...] hints let the engine undo platform resizes.
const detectImage = async (buffer, filename, engine = defaultEngine(), candidateSizes = null) => {
  const retries = Math.max(0, parseInt(process.env.FPWM_IMAGE_DETECT_RETRIES || '2', 10));
  const retryDelayMs = Math.max(
    0,
    parseInt(process.env.FPWM_IMAGE_DETECT_RETRY_DELAY_MS || '750', 10)
  );
  const timeoutMs = Math.max(
    1000,
    parseInt(process.env.FPWM_IMAGE_DETECT_TIMEOUT_MS || '30000', 10)
  );

  for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
    const form = new FormData();
    form.append('file', buffer, { filename: filename || 'image' });
    form.append('engine', engine);
    if (candidateSizes && candidateSizes.length > 0) {
      form.append('candidate_sizes', JSON.stringify(candidateSizes));
    }

    try {
      const res = await axios.post(`${baseUrl()}/v1/image/detect`, form, {
        headers: { Authorization: authHeader(), ...form.getHeaders() },
        timeout: timeoutMs,
        maxBodyLength: Infinity,
      });
      return { ...res.data, requestAttempts: attempt };
    } catch (error) {
      error.detectionAttempts = attempt;
      if (attempt > retries || !isTransientDetectionError(error)) throw error;
      await sleep(retryDelayMs * attempt);
    }
  }

  throw new Error('Image detection failed');
};

module.exports = {
  watermarkImage,
  createWatermarkImageJob,
  imageWatermarkJobStatus,
  createWatermarkVideoJob,
  videoWatermarkJobStatus,
  createDetectVideoJob,
  videoDetectJobStatus,
  detectImage,
  defaultEngine,
  defaultVideoEngine,
  imageCapabilities,
  isTransientDetectionError,
};
