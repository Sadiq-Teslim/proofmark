const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

(async () => {
  const deploy = fs.readFileSync('DEPLOY.md', 'utf8');
  const key = deploy.match(/FPWM_API_KEY=([^\s]+)/)?.[1];
  if (!key) throw new Error('missing key');
  const filePath = path.resolve('tmp/proofmark-strong-source.png');
  const form = new FormData();
  form.append('payload', '12345');
  form.append('engine', 'trustmark');
  form.append('file', fs.createReadStream(filePath), { filename: 'proofmark-strong-source.png', contentType: 'image/png' });
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
    const elapsed = ((Date.now() - started) / 1000).toFixed(2);
    fs.writeFileSync('tmp/engine-trustmark-direct-node-output.bin', Buffer.from(res.data));
    console.log(JSON.stringify({ status: res.status, elapsedSeconds: Number(elapsed), bytes: Buffer.byteLength(res.data), contentType: res.headers['content-type'], originalWidth: res.headers['x-original-width'], originalHeight: res.headers['x-original-height'] }, null, 2));
    if (res.status !== 200) console.log(Buffer.from(res.data).toString('utf8').slice(0, 1000));
  } catch (err) {
    const elapsed = ((Date.now() - started) / 1000).toFixed(2);
    console.log(JSON.stringify({ error: err.message, elapsedSeconds: Number(elapsed), status: err.response?.status, body: err.response?.data && Buffer.from(err.response.data).toString('utf8').slice(0,1000) }, null, 2));
    process.exitCode = 1;
  }
})();
