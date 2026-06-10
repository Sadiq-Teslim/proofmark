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

// Embed a payload into image bytes; returns the watermarked PNG buffer.
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
  return Buffer.from(res.data);
};

// Detect a payload in image bytes; returns { marked, payload, confidence, engine }.
const detectImage = async (buffer, filename, engine = defaultEngine()) => {
  const form = new FormData();
  form.append('file', buffer, { filename: filename || 'image' });
  form.append('engine', engine);

  const res = await axios.post(`${baseUrl()}/v1/image/detect`, form, {
    headers: { Authorization: authHeader(), ...form.getHeaders() },
    timeout: 120000,
    maxBodyLength: Infinity,
  });
  return res.data;
};

module.exports = { watermarkImage, detectImage, defaultEngine };
