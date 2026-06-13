import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  BadgeCheck,
  Clock3,
  ExternalLink,
  FileImage,
  Globe2,
  Loader2,
  Radar,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import api from '../api.js';

const protectionModes = [
  {
    label: 'Standard',
    value: 'qim-dct',
    detail: 'Fast traceable image for everyday sharing',
  },
  {
    label: 'Strong',
    value: 'trustmark',
    detail: 'Harder watermark for higher-risk public posts',
  },
];

const formatDate = (date) => new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
}).format(new Date(date));

export default function Images() {
  const [images, setImages] = useState([]);
  const [title, setTitle] = useState('');
  const [engine, setEngine] = useState('qim-dct');
  const [file, setFile] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [sightings, setSightings] = useState({});
  const [scanning, setScanning] = useState({});
  const [capabilities, setCapabilities] = useState(null);

  const load = async () => {
    const [imageResult, capResult] = await Promise.allSettled([
      api.get('/images'),
      api.get('/images/capabilities'),
    ]);
    if (imageResult.status === 'fulfilled') {
      setImages(imageResult.value.data.images || []);
    }
    if (capResult.status === 'fulfilled') {
      setCapabilities(capResult.value.data.capabilities);
    }
  };

  useEffect(() => { load(); }, []);

  const totalSightings = useMemo(() => (
    Object.values(sightings).reduce((sum, list) => sum + list.length, 0)
  ), [sightings]);

  const upload = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('engine', engine);
      fd.append('image', file);
      await api.post('/images', fd);
      setTitle('');
      setEngine('qim-dct');
      setFile(null);
      e.target.reset();
      await load();
    } catch (e2) {
      setErr(e2.response?.data?.error || e2.response?.data?.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const scan = async (id) => {
    setScanning((s) => ({ ...s, [id]: true }));
    try {
      await api.post(`/images/${id}/scan`);
      const { data } = await api.get(`/images/${id}/sightings`);
      setSightings((s) => ({ ...s, [id]: data.sightings || [] }));
    } catch (e2) {
      setErr(e2.response?.data?.error || e2.response?.data?.message || 'Scan failed');
    } finally {
      setScanning((s) => ({ ...s, [id]: false }));
    }
  };

  return (
    <main className="page-stack">
      <section className="hero-grid">
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={16} /> Image protection first</span>
          <h1>Make every picture you share traceable.</h1>
          <p>
            Pass an image through ProofMark before it leaves your hands. The protected version
            can be shared anywhere, then verified and tracked back to your property.
          </p>
          <div className="hero-stats" aria-label="ProofMark property summary">
            <div>
              <strong>{images.length}</strong>
              <span>Protected</span>
            </div>
            <div>
              <strong>{totalSightings}</strong>
              <span>Sightings</span>
            </div>
            <div>
              <strong>{images.filter((img) => img.engine === 'trustmark').length}</strong>
              <span>Strong marks</span>
            </div>
          </div>
        </div>

        <form className="upload-panel" onSubmit={upload}>
          <div className="panel-heading">
            <span className="panel-icon"><UploadCloud size={20} /></span>
            <div>
              <h2>Protect a new image</h2>
              <p>Generate the version you will publish or send.</p>
            </div>
          </div>

          <label htmlFor="title">Property name</label>
          <input
            id="title"
            placeholder="Campaign cover, product shot, artwork..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <label htmlFor="image">Image file</label>
          <label className="drop-zone" htmlFor="image">
            <FileImage size={24} />
            <span>{file ? file.name : 'Choose image'}</span>
          </label>
          <input
            id="image"
            className="sr-only"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
            required
          />

          <div className="mode-grid" role="radiogroup" aria-label="Protection mode">
            {protectionModes.map((mode) => {
              const available = capabilities?.engines?.[mode.value]?.available !== false;
              return (
              <label
                className={`mode-card ${engine === mode.value ? 'selected' : ''} ${available ? '' : 'disabled'}`}
                key={mode.value}
              >
                <input
                  type="radio"
                  name="engine"
                  value={mode.value}
                  checked={engine === mode.value}
                  disabled={!available}
                  onChange={(e) => setEngine(e.target.value)}
                />
                <strong>{mode.label}</strong>
                <span>{available ? mode.detail : 'Available after TrustMark passes production benchmark'}</span>
              </label>
              );
            })}
          </div>

          {err && <div className="err">{err}</div>}
          <button className="primary-button" disabled={busy || !file}>
            {busy ? <Loader2 className="spin" size={18} /> : <ShieldCheck size={18} />}
            <span>{busy ? 'Protecting image' : 'Create protected image'}</span>
          </button>
        </form>
      </section>

      <section className="section-heading">
        <div>
          <span className="eyebrow"><Globe2 size={16} /> Property</span>
          <h2>Your protected images</h2>
        </div>
      </section>

      {images.length === 0 ? (
        <div className="empty-state">
          <FileImage size={34} />
          <h3>No protected images yet</h3>
          <p>Your first ProofMark image will appear here with download, verification, and tracking tools.</p>
        </div>
      ) : (
        <div className="property-grid">
          {images.map((img) => (
            <article className="property-card" key={img.id}>
              <a className="image-frame" href={img.watermarkedUrl} target="_blank" rel="noreferrer">
                <img src={img.watermarkedUrl} alt={img.title} />
              </a>
              <div className="property-body">
                <div className="property-title-row">
                  <div>
                    <h3>{img.title}</h3>
                    <p><Clock3 size={14} /> Protected {formatDate(img.createdAt)}</p>
                  </div>
                  <span className="status-pill">{img.engine === 'trustmark' ? 'Strong' : 'Standard'}</span>
                </div>

                <div className="metadata-row">
                  <span>Payload #{img.payload}</span>
                  {img.width && img.height && <span>{img.width} x {img.height}</span>}
                </div>

                <div className="action-row">
                  <a className="button-link" href={img.watermarkedUrl} target="_blank" rel="noreferrer">
                    <ArrowDownToLine size={17} />
                    <span>Download</span>
                  </a>
                  <button className="secondary-button" onClick={() => scan(img.id)} disabled={scanning[img.id]}>
                    {scanning[img.id] ? <Loader2 className="spin" size={17} /> : <Radar size={17} />}
                    <span>{scanning[img.id] ? 'Scanning' : 'Track'}</span>
                  </button>
                </div>

                {sightings[img.id] && (
                  <div className="sightings-panel">
                    {sightings[img.id].length === 0 ? (
                      <p>No public copies found yet.</p>
                    ) : (
                      sightings[img.id].map((s) => (
                        <a className="sighting-row" href={s.pageUrl} target="_blank" rel="noreferrer" key={s.id}>
                          <span>
                            {s.confirmed ? <BadgeCheck size={16} /> : <Globe2 size={16} />}
                            {s.confirmed ? 'Watermark confirmed' : 'Visual match'}
                          </span>
                          <ExternalLink size={15} />
                        </a>
                      ))
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
