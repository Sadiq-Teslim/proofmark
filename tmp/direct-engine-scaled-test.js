const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

async function run(filePath, payload) {
  const deploy = fs.readFileSync('C:/Users/Admin/fairplayafrica/proofmark/DEPLOY.md', 'utf8');
  const key = deploy.match(/FPWM_API_KEY=([^\s]+)/)?.[1];
  const form = new FormData();
  form.append('payload', String(payload));
  form.append('engine', 'trustmark');
  form.append('file', fs.createReadStream(filePath), { filename: path.basename(filePath), contentType: 'image/jpeg' });
  const started = Date.now();
  try {
    const res = await axios.post('https://watermarking-engine.onrender.com/v1/image/watermark', form, {
      headers: { Authorization: `Bearer ${key}`, ...form.getHeaders() },
      responseType: 'arraybuffer',
      timeout: 420000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      validateStatus: () => true,
    });
    const elapsedSeconds = Number(((Date.now() - started) / 1000).toFixed(2));
    const outPath = `tmp/engine-trustmark-${path.basename(filePath)}.bin`;
    fs.writeFileSync(outPath, Buffer.from(res.data));
    console.log(JSON.stringify({ file: path.basename(filePath), status: res.status, elapsedSeconds, bytes: Buffer.byteLength(res.data), outPath, contentType: res.headers['content-type'] }));
  } catch (err) {
    const elapsedSeconds = Number(((Date.now() - started) / 1000).toFixed(2));
    console.log(JSON.stringify({ file: path.basename(filePath), error: err.message, elapsedSeconds, status: err.response?.status }));
  }
}
(async () => {
  for (const size of ['1024','768','512']) await run(`C:/Users/Admin/fairplayafrica/watermark-engine/tmp/proofmark-strong-source-${size}.jpg`, Number(size));
})();
