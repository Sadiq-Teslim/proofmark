import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownToLine,
  BadgeCheck,
  Check,
  Fingerprint,
  Lock,
  Radar,
  ShieldCheck,
  Sparkles,
  Video,
} from 'lucide-react';
import api from '../../api.js';
import { Dropzone, Spinner, downloadBlob } from '../../components/ui/widgets.jsx';

const RESILIENCE = [
  'JPEG re-compression',
  'Resizing & cropping',
  'Social re-encode (IG / X / WhatsApp)',
  'Screenshots & re-uploads',
];

export default function Protect() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [engine, setEngine] = useState('qim-dct');
  const [standardAvailable, setStandardAvailable] = useState(null);
  const [strongAvailable, setStrongAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [err, setErr] = useState('');
  const [result, setResult] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get('/images/capabilities')
      .then(({ data }) => {
        setStandardAvailable(Boolean(data.capabilities?.engines?.['qim-dct']?.available));
        setStrongAvailable(Boolean(data.capabilities?.engines?.trustmark?.available));
      })
      .catch(() => {
        setStandardAvailable(false);
        setStrongAvailable(false);
      });
  }, []);

  const pollJob = async (jobId) => {
    for (let i = 0; i < 60; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 3000));
      // eslint-disable-next-line no-await-in-loop
      const { data } = await api.get(`/images/jobs/${jobId}`);
      if (data.job?.status === 'ready' && data.image) return data.image;
      if (data.job?.status === 'error') throw new Error(data.job.error || 'Protection failed');
    }
    throw new Error('Protection timed out — check back shortly');
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setResult(null);
    setBusy(true);
    setStatusText('Uploading & watermarking…');
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('engine', engine);
      fd.append('image', file);
      const res = await api.post('/images', fd);
      let image = res.data.image;
      if (!image && res.data.job) {
        setStatusText('Applying strong protection… this can take a moment');
        image = await pollJob(res.data.job.id);
      }
      setResult(image);
      setTitle('');
      setFile(null);
    } catch (e2) {
      setErr(e2.response?.data?.message || e2.message || 'Protection failed');
    } finally {
      setBusy(false);
      setStatusText('');
    }
  };

  const download = async () => {
    if (!result) return;
    setDownloading(true);
    try {
      const res = await api.get(`/images/${result.id}/download`, { responseType: 'blob' });
      downloadBlob(res.data, `${result.title || 'proofmark'}-protected.png`);
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="app-page-head">
      <div>
        <h2>Protect an image</h2>
        <p className="app-muted">Upload an image and get a watermarked version to publish or send.</p>
      </div>
      <div className="app-segment media-switch">
        <button type="button" className="active">
          <ShieldCheck size={15} /> Image
        </button>
        <button type="button" onClick={() => navigate('/app/protect-video')}>
          <Video size={15} /> Video
        </button>
      </div>
      <div className="protect-grid">
        <form className="app-card protect-form" onSubmit={submit}>
          <label className="app-label" htmlFor="title">Property name</label>
          <input
            id="title"
            className="app-input"
            placeholder="Campaign cover, product shot, artwork…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <label className="app-label">Image file</label>
          <Dropzone file={file} onFile={setFile} />

          <label className="app-label">Protection mode</label>
          <div className="protect-modes">
            <button
              type="button"
              className={`protect-mode ${engine === 'qim-dct' ? 'active' : ''} ${standardAvailable === false ? 'disabled' : ''}`}
              onClick={() => setEngine('qim-dct')}
              disabled={standardAvailable === false}
            >
              <ShieldCheck size={18} />
              <div>
                <strong>Standard</strong>
                <span>Fast · survives compression, resizing &amp; re-uploads</span>
              </div>
              {engine === 'qim-dct' && <Check className="protect-mode-check" size={18} />}
            </button>
            <button
              type="button"
              className={`protect-mode ${engine === 'trustmark' ? 'active' : ''} ${strongAvailable ? '' : 'disabled'}`}
              onClick={() => strongAvailable && setEngine('trustmark')}
              disabled={!strongAvailable}
              title={strongAvailable ? '' : 'Strong protection is not enabled yet'}
            >
              <Sparkles size={18} />
              <div>
                <strong>Strong {strongAvailable ? '' : '· coming soon'}</strong>
                <span>Neural · survives screenshots &amp; heavy social re-encode</span>
              </div>
              {engine === 'trustmark' && <Check className="protect-mode-check" size={18} />}
            </button>
          </div>

          {err && <div className="app-error">{err}</div>}
          {standardAvailable === false && (
            <div className="app-error">
              Protection is temporarily unavailable while the watermark engine reconnects.
            </div>
          )}

          <button
            className="app-primary-btn protect-submit"
            disabled={busy || !file || !title || standardAvailable !== true}
          >
            {busy ? <Spinner /> : <ShieldCheck size={16} />}
            <span>{busy ? (statusText || 'Protecting…') : 'Create protected image'}</span>
          </button>
        </form>

        <aside className="protect-side">
          {result ? (
            <div className="app-card protect-result">
              <span className="app-pill success"><BadgeCheck size={14} /> Protected</span>
              <img src={result.watermarkedUrl} alt={result.title} className="protect-result-img" />
              <h3>{result.title}</h3>
              <p className="app-muted"><Fingerprint size={14} /> Payload #{result.payload}</p>
              <div className="protect-result-actions">
                <button className="app-primary-btn" onClick={download} disabled={downloading}>
                  {downloading ? <Spinner size={15} /> : <ArrowDownToLine size={15} />}
                  <span>Download</span>
                </button>
                <button className="app-ghost-btn" onClick={() => navigate('/app/tracking')}>
                  <Radar size={15} /><span>Track</span>
                </button>
                <button className="app-ghost-btn" onClick={() => navigate('/app/verify')}>
                  <BadgeCheck size={15} /><span>Verify</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="app-card protect-info">
                <h3>What happens</h3>
                <ol className="protect-steps">
                  <li><span>1</span> We embed an invisible forensic payload in your image.</li>
                  <li><span>2</span> You download the protected version and publish it.</li>
                  <li><span>3</span> Verify or track any copy that surfaces later.</li>
                </ol>
              </div>
              <div className="app-card protect-info">
                <h3>Expected resilience</h3>
                <ul className="protect-resilience">
                  {RESILIENCE.map((item) => (
                    <li key={item}><Check size={15} /> {item}</li>
                  ))}
                </ul>
              </div>
              <div className="app-card protect-privacy">
                <Lock size={16} />
                <p>Your original stays private. We only store what&apos;s needed to prove ownership.</p>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
