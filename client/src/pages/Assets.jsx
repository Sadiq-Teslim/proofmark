import { useEffect, useState } from 'react';
import api from '../api.js';

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await api.get('/assets');
    setAssets(data.assets);
  };
  useEffect(() => { load(); }, []);

  const upload = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('image', file);
      await api.post('/assets', fd);
      setTitle(''); setFile(null);
      e.target.reset();
      await load();
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Upload failed');
    } finally { setBusy(false); }
  };

  return (
    <>
      <h1>Assets</h1>
      <div className="card">
        <h2>Upload an image to protect</h2>
        <form onSubmit={upload}>
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          <label>Image file</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} required />
          {err && <div className="err">{err}</div>}
          <button disabled={busy}>{busy ? 'Uploading…' : 'Upload asset'}</button>
        </form>
      </div>

      {assets.map((a) => (
        <div className="card row" key={a.id} style={{ alignItems: 'center' }}>
          <img src={a.originalUrl} alt={a.title} style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8 }} />
          <div>
            <div style={{ fontWeight: 600 }}>{a.title}</div>
            <div className="muted">added {new Date(a.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      ))}
      {assets.length === 0 && <p className="muted">No assets yet — upload one above.</p>}
    </>
  );
}
