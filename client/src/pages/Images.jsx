import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  BadgeCheck,
  Clock3,
  Copy,
  ExternalLink,
  FileImage,
  Globe2,
  Loader2,
  Radar,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api.js';

const survivalCards = [
  ['JPEG compression', 'Passed'],
  ['Social re-encode', 'Passed'],
  ['Resizing', 'Passed'],
  ['WhatsApp-style compression', 'Passed'],
  ['Mild blur, noise, contrast', 'Passed'],
  ['Caption overlays', 'Often recoverable'],
];

const launchSteps = [
  ['Upload', 'Choose the image before it leaves your hands.'],
  ['Download', 'Use the protected version anywhere you publish or send it.'],
  ['Verify', 'Upload a copy later and ProofMark traces it back when the mark survives.'],
];

const formatDate = (date) => new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
}).format(new Date(date));

export default function Images() {
  const [images, setImages] = useState([]);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [sightings, setSightings] = useState({});
  const [scanning, setScanning] = useState({});
  const [downloading, setDownloading] = useState({});
  const [copied, setCopied] = useState('');
  const [info, setInfo] = useState('');

  const load = async () => {
    const [imageResult] = await Promise.allSettled([
      api.get('/images'),
    ]);
    if (imageResult.status === 'fulfilled') {
      setImages(imageResult.value.data.images || []);
    }
  };

  useEffect(() => { load(); }, []);

  const totalSightings = useMemo(() => (
    Object.values(sightings).reduce((sum, list) => sum + list.length, 0)
  ), [sightings]);

  const upload = async (e) => {
    e.preventDefault();
    setErr('');
    setInfo('');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('engine', 'qim-dct');
      fd.append('image', file);
      await api.post('/images', fd);
      setTitle('');
      setFile(null);
      e.target.reset();
      setInfo('Protected image created. Download it from your properties and use that version when sharing.');
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

  const downloadImage = async (img) => {
    setErr('');
    setDownloading((s) => ({ ...s, [img.id]: true }));
    try {
      const response = await api.get(`/images/${img.id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      const fallback = `${img.title || 'proofmark-image'}-proofmark.png`
        .replace(/[^a-z0-9._-]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
      const disposition = response.headers['content-disposition'] || '';
      const match = disposition.match(/filename="([^"]+)"/i);
      link.href = url;
      link.download = match?.[1] || fallback || 'proofmark-image.png';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e2) {
      setErr(e2.response?.data?.error || e2.response?.data?.message || 'Download failed');
    } finally {
      setDownloading((s) => ({ ...s, [img.id]: false }));
    }
  };

  const copyProtectedUrl = async (img) => {
    setErr('');
    try {
      await navigator.clipboard.writeText(img.watermarkedUrl);
      setCopied(img.id);
      window.setTimeout(() => setCopied(''), 1600);
    } catch {
      setErr('Could not copy protected URL');
    }
  };

  return (
    <main className="page-stack v1-dashboard">
      <section className="v1-hero">
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={16} /> ProofMark V1</span>
          <h1>Protect images before you share them.</h1>
          <p>
            ProofMark creates a traceable version of your image that can survive common
            reposting, compression, resizing, and re-uploads.
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
              <strong>V1</strong>
              <span>Live protection</span>
            </div>
          </div>
        </div>

        <form className="upload-panel" onSubmit={upload}>
          <div className="panel-heading">
            <span className="panel-icon"><UploadCloud size={20} /></span>
            <div>
              <h2>Protect a new image</h2>
              <p>Generate the exact version you should publish, send, or post.</p>
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

          <div className="protection-badge" aria-label="Protection mode">
            <ShieldCheck size={18} />
            <div>
              <strong>ProofMark Protection</strong>
              <span>Optimized for common sharing, compression, resizing, and reposting.</span>
            </div>
          </div>

          {err && <div className="err">{err}</div>}
          {info && <div className="info">{info}</div>}
          <button className="primary-button" disabled={busy || !file}>
            {busy ? <Loader2 className="spin" size={18} /> : <ShieldCheck size={18} />}
            <span>{busy ? 'Protecting image' : 'Create protected image'}</span>
          </button>
        </form>
      </section>

      <section className="v1-next-steps" aria-label="How ProofMark works">
        {launchSteps.map(([titleText, body], index) => (
          <article key={titleText}>
            <span>{index + 1}</span>
            <h3>{titleText}</h3>
            <p>{body}</p>
          </article>
        ))}
      </section>

      <section className="v1-survival" aria-label="What ProofMark V1 survives">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow"><ShieldCheck size={16} /> What V1 survives</span>
            <h2>Built for everyday reposting abuse.</h2>
          </div>
        </div>
        <div className="survival-grid">
          {survivalCards.map(([label, status]) => (
            <article key={label}>
              <BadgeCheck size={18} />
              <strong>{label}</strong>
              <span>{status}</span>
            </article>
          ))}
        </div>
        <p className="launch-note">
          V1 is optimized for common sharing and reposting transformations. Cropping,
          rotation, and framed screenshots are advanced cases planned for future protection.
        </p>
      </section>

      <section className="section-heading" id="properties">
        <div>
          <span className="eyebrow"><Globe2 size={16} /> Property</span>
          <h2>Your protected images</h2>
        </div>
      </section>

      {images.length === 0 ? (
        <div className="empty-state launch-empty">
          <FileImage size={34} />
          <h3>Create your first protected image</h3>
          <p>Upload an image, download the protected copy, then verify reposted copies from this dashboard.</p>
          <div className="empty-steps">
            {launchSteps.map(([titleText]) => <span key={titleText}>{titleText}</span>)}
          </div>
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
                  <span className="status-pill">Protected</span>
                </div>

                <div className="metadata-row">
                  <span>Payload #{img.payload}</span>
                  {img.width && img.height && <span>{img.width} x {img.height}</span>}
                </div>

                <div className="action-row">
                  <button
                    className="secondary-button"
                    onClick={() => downloadImage(img)}
                    disabled={downloading[img.id]}
                  >
                    {downloading[img.id] ? <Loader2 className="spin" size={17} /> : <ArrowDownToLine size={17} />}
                    <span>{downloading[img.id] ? 'Downloading' : 'Download'}</span>
                  </button>
                  <Link className="secondary-button" to="/verify">
                    <SearchCheck size={17} />
                    <span>Verify</span>
                  </Link>
                  <button className="secondary-button" onClick={() => scan(img.id)} disabled={scanning[img.id]}>
                    {scanning[img.id] ? <Loader2 className="spin" size={17} /> : <Radar size={17} />}
                    <span>{scanning[img.id] ? 'Scanning' : 'Track'}</span>
                  </button>
                  <button className="secondary-button" onClick={() => copyProtectedUrl(img)}>
                    <Copy size={17} />
                    <span>{copied === img.id ? 'Copied' : 'Copy URL'}</span>
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
