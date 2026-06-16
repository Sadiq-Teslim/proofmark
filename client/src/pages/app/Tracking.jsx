import { useEffect, useState } from 'react';
import { ExternalLink, Radar, ScanSearch, ShieldCheck } from 'lucide-react';
import api from '../../api.js';
import { EmptyState, Spinner, formatDate } from '../../components/ui/widgets.jsx';

export default function Tracking() {
  const [sightings, setSightings] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanId, setScanId] = useState('');
  const [scanning, setScanning] = useState(false);
  const [url, setUrl] = useState('');
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = () => Promise.allSettled([
    api.get('/images/sightings'),
    api.get('/images'),
  ]).then(([sig, img]) => {
    if (sig.status === 'fulfilled') setSightings(sig.value.data.sightings || []);
    if (img.status === 'fulfilled') setImages(img.value.data.images || []);
    setLoading(false);
  });

  useEffect(() => { load(); }, []);

  const scan = async () => {
    if (!scanId) return;
    setScanning(true); setErr(''); setMsg('');
    try {
      const { data } = await api.post(`/images/${scanId}/scan`);
      setMsg(`Scan complete · ${data.created ?? 0} new, ${data.confirmed ?? 0} confirmed.`);
      await load();
    } catch (e2) {
      setErr(e2.response?.data?.error || e2.response?.data?.message || 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const checkUrl = async (e) => {
    e.preventDefault();
    setChecking(true); setErr(''); setMsg('');
    try {
      const { data } = await api.post('/verify/url', { url });
      setMsg(data.message || 'Checked.');
      setUrl('');
      await load();
    } catch (e2) {
      setErr(e2.response?.data?.error || e2.response?.data?.message || 'Check failed');
    } finally {
      setChecking(false);
    }
  };

  const confirmed = sightings.filter((s) => s.confirmed).length;

  if (loading) return <div className="app-loading"><Spinner size={26} /></div>;

  return (
    <div className="app-page-head">
      <div>
        <h2>Tracking</h2>
        <p className="app-muted">Find where your protected images surface across the web.</p>
      </div>

      <div className="app-stat-row track-stats">
        <div className="app-card app-stat">
          <span className="app-stat-icon"><Radar size={18} /></span>
          <strong>{sightings.length}</strong><span className="app-muted">Total sightings</span>
        </div>
        <div className="app-card app-stat">
          <span className="app-stat-icon"><ShieldCheck size={18} /></span>
          <strong>{confirmed}</strong><span className="app-muted">Watermark confirmed</span>
        </div>
        <div className="app-card app-stat">
          <span className="app-stat-icon"><ScanSearch size={18} /></span>
          <strong>{sightings.length - confirmed}</strong><span className="app-muted">Visual-only</span>
        </div>
      </div>

      <div className="track-tools">
        <div className="app-card track-tool">
          <h3>Scan a property for copies</h3>
          <p className="app-muted">Searches the web and confirms matches by reading the watermark.</p>
          <div className="track-tool-row">
            <select className="app-input" value={scanId} onChange={(e) => setScanId(e.target.value)}>
              <option value="">Select a property…</option>
              {images.map((img) => <option key={img.id} value={img.id}>{img.title}</option>)}
            </select>
            <button className="app-primary-btn" onClick={scan} disabled={!scanId || scanning}>
              {scanning ? <Spinner size={15} /> : <Radar size={15} />}<span>Scan</span>
            </button>
          </div>
        </div>

        <form className="app-card track-tool" onSubmit={checkUrl}>
          <h3>Check a specific URL</h3>
          <p className="app-muted">Paste a link to a suspected copy to confirm and log it.</p>
          <div className="track-tool-row">
            <input
              className="app-input"
              type="url"
              placeholder="https://example.com/post-with-your-image"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <button className="app-primary-btn" disabled={!url || checking}>
              {checking ? <Spinner size={15} /> : <ExternalLink size={15} />}<span>Check</span>
            </button>
          </div>
        </form>
      </div>

      {msg && <div className="app-note">{msg}</div>}
      {err && <div className="app-error">{err}</div>}

      <section className="app-card">
        <div className="app-card-head"><h3>Sightings</h3></div>
        {sightings.length === 0 ? (
          <EmptyState icon={Radar} title="No copies found yet">
            Scan a property or check a URL to start tracking where your images appear.
          </EmptyState>
        ) : (
          <div className="app-cards-list">
            {sightings.map((s) => (
              <div className="track-sighting" key={s.id}>
                <div className="track-sighting-main">
                  <span className={`app-pill ${s.confirmed ? 'success' : 'neutral'}`}>
                    {s.confirmed ? 'Watermark confirmed' : 'Visual match'}
                  </span>
                  <a className="track-sighting-url" href={s.pageUrl} target="_blank" rel="noreferrer">
                    {s.pageUrl} <ExternalLink size={13} />
                  </a>
                </div>
                <div className="track-sighting-meta app-muted">
                  <span>{s.image?.title || 'Unknown property'}</span>
                  <span>{s.source || 'web'}</span>
                  <span>{formatDate(s.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
