import { useState } from 'react';
import api from '../api.js';

export default function Trace() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const trace = async (e) => {
    e.preventDefault();
    setErr(''); setResult(null); setBusy(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/trace', fd);
      setResult(data);
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Trace failed');
    } finally { setBusy(false); }
  };

  return (
    <>
      <h1>Trace a leaked image</h1>
      <div className="card">
        <p className="muted">Upload a suspect image to find which recipient it was issued to.</p>
        <form onSubmit={trace}>
          <label>Suspect image</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} required />
          {err && <div className="err">{err}</div>}
          <button disabled={busy}>{busy ? 'Analyzing…' : 'Trace'}</button>
        </form>
      </div>

      {result && (
        <div className="card">
          {result.match ? (
            <>
              <div className="ok">Match found — payload #{result.match.payload}</div>
              <p>Issued to <b>{result.match.recipient?.name}</b>
                {result.match.recipient?.email ? ` (${result.match.recipient.email})` : ''}</p>
              <p className="muted">
                Asset “{result.match.asset?.title}” · issued {new Date(result.match.issuedAt).toLocaleString()}
                · engine {result.match.engine}
              </p>
            </>
          ) : result.found ? (
            <div className="muted">A watermark was detected, but it doesn’t match any of your issued copies.</div>
          ) : (
            <div className="muted">No watermark detected in this image.</div>
          )}
        </div>
      )}
    </>
  );
}
