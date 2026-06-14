const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const deploy = fs.readFileSync('C:/Users/Admin/fairplayafrica/proofmark/DEPLOY.md', 'utf8');
const key = deploy.match(/FPWM_API_KEY=([^\s]+)/)?.[1];
async function watermark(file, payload) {
  const form = new FormData();
  form.append('payload', String(payload));
  form.append('engine', 'trustmark');
  form.append('file', fs.createReadStream(file), { filename: path.basename(file), contentType: 'image/jpeg' });
  const started = Date.now();
  try {
    const res = await axios.post('https://watermarking-engine.onrender.com/v1/image/watermark', form, {
      headers: { Authorization: `Bearer ${key}`, ...form.getHeaders() },
      responseType: 'arraybuffer', timeout: 420000, maxBodyLength: Infinity, maxContentLength: Infinity,
      validateStatus: () => true,
    });
    const elapsedSeconds = Number(((Date.now() - started) / 1000).toFixed(2));
    const out = `tmp/live-trustmark-out-${payload}.png`;
    fs.writeFileSync(out, Buffer.from(res.data));
    console.log(JSON.stringify({file:path.basename(file), status:res.status, elapsedSeconds, bytes:Buffer.byteLength(res.data), contentType:res.headers['content-type'], body: res.status === 200 ? undefined : Buffer.from(res.data).toString('utf8').slice(0,500)}));
    return {status:res.status,out};
  } catch (e) {
    console.log(JSON.stringify({file:path.basename(file), error:e.message, status:e.response?.status, elapsedSeconds:Number(((Date.now()-started)/1000).toFixed(2))}));
    return {status:0};
  }
}
(async () => {
 for (const size of [128,256,384,512]) {
   const r = await watermark(`tmp/live-trustmark-small-${size}.jpg`, size + 1000);
   if (r.status === 200) break;
 }
})();
