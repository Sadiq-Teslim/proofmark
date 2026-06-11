import { useEffect, useState } from 'react';
import api from '../api.js';

export default function Images() {
  const [images, setImages] = useState([]);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [sightings, setSightings] = useState({});
  const [scanning, setScanning] = useState({});

  const load = async () => {
    const { data } = await api.get('/images');
    setImages(data.images);
  };
  useEffect(() => { load(); }, []);

  const upload = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('image', file);
      await api.post('/images', fd);
      setTitle(''); setFile(null);
      e.target.reset();
      await load();
    } catch (e2) {
      setErr(e2.response?.data?.error || e2.response?.data?.message || 'Upload failed');
    } finally { setBusy(false); }
  };

  const scan = async (id) => {
    setScanning((s) => ({ ...s, [id]: true }));
    try {
      await api.post(`/images/${id}/scan`);
      const { data } = await api.get(`/images/${id}/sightings`);
      setSightings((s) => ({ ...s, [id]: data.sightings }));
    } catch (e2) {
      alert(e2.response?.data?.error || e2.response?.data?.message || 'Scan failed');
    } finally { setScanning((s) => ({ ...s, [id]: false })); }
  };

  return (
    <>
      <h1>My images</h1>
      <div className="card">
        <h2>Watermark an image</h2>
        <p className="muted">Upload an image, get a watermarked copy to post anywhere.</p>
        <form onSubmit={upload}>
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          <label>Image file</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} required />
          {err && <div className="err">{err}</div>}
          <button disabled={busy}>{busy ? 'Watermarking…' : 'Watermark image'}</button>
        </form>
      </div>

      {images.map((img) => (
        <div className="card" key={img.id}>
          <div className="row" style={{ alignItems: 'center' }}>
            <img src={img.watermarkedUrl} alt={img.title}
              style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8 }} />
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontWeight: 600 }}>{img.title}</div>
              <div className="muted">
                <span className="tag">#{img.payload}</span>{' '}
                {new Date(img.createdAt).toLocaleDateString()}
              </div>
            </div>
            <a href={img.watermarkedUrl} target="_blank" rel="noreferrer">
              <button>Download watermarked</button>
            </a>
            <button className="btn-ghost" onClick={() => scan(img.id)} disabled={scanning[img.id]}>
              {scanning[img.id] ? 'Scanning…' : 'Scan for copies'}
            </button>
          </div>

          {sightings[img.id] && (
            <div style={{ marginTop: 12 }}>
              {sightings[img.id].length === 0 ? (
                <div className="muted">No copies found on the web yet.</div>
              ) : (
                <table>
                  <thead><tr><th>Found on</th><th>Status</th></tr></thead>
                  <tbody>
                    {sightings[img.id].map((s) => (
                      <tr key={s.id}>
                        <td><a href={s.pageUrl} target="_blank" rel="noreferrer">{s.pageUrl}</a></td>
                        <td>
                          {s.confirmed
                            ? <span className="ok">✓ watermark confirmed</span>
                            : <span className="muted">visual match</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      ))}
      {images.length === 0 && <p className="muted">No images yet — watermark one above.</p>}
    </>
  );
}
