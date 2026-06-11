import { useState } from 'react';
import api from '../api.js';

export default function Verify() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const verify = async (e) => {
    e.preventDefault();
    setErr(''); setResult(null); setBusy(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/verify', fd);
      setResult(data);
    } catch (e2) {
      setErr(e2.response?.data?.error || e2.response?.data?.message || 'Verify failed');
    } finally { setBusy(false); }
  };

  return (
    <>
      <h1>Verify an image</h1>
      <div className="card">
        <p className="muted">
          Found a copy somewhere? Upload it to check if it&apos;s one of your watermarked images.
        </p>
        <form onSubmit={verify}>
          <label>Image to check</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} required />
          {err && <div className="err">{err}</div>}
          <button disabled={busy}>{busy ? 'Checking…' : 'Verify'}</button>
        </form>
      </div>

      {result && (
        <div className="card">
          {result.watermarked && result.mine ? (
            <>
              <div className="ok">✓ This is your image — “{result.match.title}”</div>
              <p className="muted">
                payload #{result.match.payload} · watermarked{' '}
                {new Date(result.match.createdAt).toLocaleString()}
              </p>
              <img className="preview" src={result.match.watermarkedUrl} alt="your image" />
            </>
          ) : result.watermarked ? (
            <div className="muted">A ProofMark watermark was detected, but not one of your images.</div>
          ) : (
            <div className="muted">No ProofMark watermark detected in this image.</div>
          )}
        </div>
      )}
    </>
  );
}
