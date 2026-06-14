const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const deploy = fs.readFileSync('C:/Users/Admin/fairplayafrica/proofmark/DEPLOY.md', 'utf8');
const key = deploy.match(/FPWM_API_KEY=([^\s]+)/)?.[1];
if (!key) throw new Error('Missing FPWM key');
const source = 'C:/Users/Admin/fairplayafrica/proofmark/tmp/proofmark-strong-source.png';
const outPath = 'C:/Users/Admin/fairplayafrica/proofmark/tmp/live-trustmark-smoke-output.png';
const payload = 54321;

async function watermark() {
  const form = new FormData();
  form.append('payload', String(payload));
  form.append('engine', 'trustmark');
  form.append('file', fs.createReadStream(source), { filename: 'proofmark-strong-source.png', contentType: 'image/png' });
  const started = Date.now();
  const res = await axios.post('https://watermarking-engine.onrender.com/v1/image/watermark', form, {
    headers: { Authorization: `Bearer ${key}`, ...form.getHeaders() },
    responseType: 'arraybuffer',
    timeout: 420000,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    validateStatus: () => true,
  });
  fs.writeFileSync(outPath, Buffer.from(res.data));
  return {
    status: res.status,
    elapsedSeconds: Number(((Date.now() - started) / 1000).toFixed(2)),
    bytes: Buffer.byteLength(res.data),
    contentType: res.headers['content-type'],
    originalWidth: res.headers['x-original-width'],
    originalHeight: res.headers['x-original-height'],
    body: res.status === 200 ? undefined : Buffer.from(res.data).toString('utf8').slice(0, 1000),
  };
}

async function detect() {
  const form = new FormData();
  form.append('engine', 'trustmark');
  form.append('file', fs.createReadStream(outPath), { filename: 'live-trustmark-smoke-output.png', contentType: 'image/png' });
  const started = Date.now();
  const res = await axios.post('https://watermarking-engine.onrender.com/v1/image/detect', form, {
    headers: { Authorization: `Bearer ${key}`, ...form.getHeaders() },
    timeout: 420000,
    maxBodyLength: Infinity,
    validateStatus: () => true,
  });
  return {
    status: res.status,
    elapsedSeconds: Number(((Date.now() - started) / 1000).toFixed(2)),
    data: res.data,
  };
}

(async () => {
  const wm = await watermark();
  console.log(JSON.stringify({ step: 'watermark', ...wm }, null, 2));
  if (wm.status !== 200) process.exit(2);
  const det = await detect();
  console.log(JSON.stringify({ step: 'detect', ...det }, null, 2));
  if (det.status !== 200 || det.data.payload !== payload || det.data.marked !== true) process.exit(3);
})();
