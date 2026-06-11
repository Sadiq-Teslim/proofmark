import { useEffect, useState } from 'react';
import api from '../api.js';

export default function Issue() {
  const [assets, setAssets] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [assetId, setAssetId] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const [a, r] = await Promise.all([api.get('/assets'), api.get('/recipients')]);
      setAssets(a.data.assets);
      setRecipients(r.data.recipients);
    })();
  }, []);

  const issue = async (e) => {
    e.preventDefault();
    setErr(''); setResult(null); setBusy(true);
    try {
      const { data } = await api.post('/issuances', { assetId, recipientId });
      setResult(data);
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Issue failed');
    } finally { setBusy(false); }
  };

  return (
    <>
      <h1>Issue a marked copy</h1>
      <div className="card">
        <form onSubmit={issue}>
          <label>Asset</label>
          <select value={assetId} onChange={(e) => setAssetId(e.target.value)} required>
            <option value="">Select an asset…</option>
            {assets.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>
          <label>Recipient</label>
          <select value={recipientId} onChange={(e) => setRecipientId(e.target.value)} required>
            <option value="">Select a recipient…</option>
            {recipients.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          {err && <div className="err">{err}</div>}
          <button disabled={busy}>{busy ? 'Watermarking…' : 'Issue marked copy'}</button>
        </form>
      </div>

      {result && (
        <div className="card">
          <div className="ok">Issued — payload #{result.issuance.payload}</div>
          <p className="muted">
            For {result.issuance.recipient?.name} · asset “{result.issuance.asset?.title}”
          </p>
          <a href={result.downloadUrl} target="_blank" rel="noreferrer">
            <button>Download marked image</button>
          </a>
          <img className="preview" src={result.downloadUrl} alt="watermarked" />
        </div>
      )}
    </>
  );
}
