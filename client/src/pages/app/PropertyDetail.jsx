import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowDownToLine, ArrowLeft, BadgeCheck, Download, ExternalLink, Fingerprint, Radar,
} from 'lucide-react';
import api from '../../api.js';
import {
  EmptyState, Spinner, downloadBlob, formatDate, formatDateTime,
} from '../../components/ui/widgets.jsx';

const TABS = ['Overview', 'Verifications', 'Sightings', 'Evidence'];

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [sightings, setSightings] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [tab, setTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  const load = () => Promise.allSettled([
    api.get(`/images/${id}`),
    api.get(`/images/${id}/sightings`),
    api.get('/verify'),
  ]).then(([img, sig, ver]) => {
    if (img.status === 'fulfilled') setImage(img.value.data.image);
    if (sig.status === 'fulfilled') setSightings(sig.value.data.sightings || []);
    if (ver.status === 'fulfilled') {
      setVerifications((ver.value.data.verifications || []).filter((v) => v.image?.id === id));
    }
    setLoading(false);
  });

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const download = async () => {
    setBusy('download');
    try {
      const res = await api.get(`/images/${id}/download`, { responseType: 'blob' });
      downloadBlob(res.data, `${image?.title || 'proofmark'}-protected.png`);
    } finally { setBusy(''); }
  };

  const scan = async () => {
    setBusy('scan'); setErr('');
    try {
      await api.post(`/images/${id}/scan`);
      await load();
      setTab('Sightings');
    } catch (e2) {
      setErr(e2.response?.data?.error || e2.response?.data?.message || 'Scan failed');
    } finally { setBusy(''); }
  };

  const downloadReport = async (vid) => {
    const res = await api.get(`/verify/${vid}/report`, { responseType: 'blob' });
    downloadBlob(res.data, `proofmark-verification-${vid}.md`);
  };

  if (loading) return <div className="app-loading"><Spinner size={26} /></div>;
  if (!image) {
    return (
      <div className="app-card">
        <EmptyState icon={ArrowLeft} title="Property not found" action={<Link className="app-ghost-btn" to="/app/properties">Back to properties</Link>} />
      </div>
    );
  }

  return (
    <div className="pd">
      <Link className="app-back" to="/app/properties"><ArrowLeft size={16} /> Properties</Link>

      <div className="app-card pd-hero">
        <img className="pd-hero-img" src={image.watermarkedUrl} alt={image.title} />
        <div className="pd-hero-body">
          <span className="app-pill success"><BadgeCheck size={13} /> Protected</span>
          <h2>{image.title}</h2>
          <div className="pd-meta">
            <span><Fingerprint size={14} /> Payload #{image.payload}</span>
            <span>Engine: {image.engine}</span>
            <span>Protected {formatDate(image.createdAt)}</span>
          </div>
          <div className="pd-actions">
            <button className="app-primary-btn" onClick={download} disabled={busy === 'download'}>
              {busy === 'download' ? <Spinner size={15} /> : <ArrowDownToLine size={15} />}<span>Download</span>
            </button>
            <button className="app-ghost-btn" onClick={() => navigate('/app/verify')}><BadgeCheck size={15} /><span>Verify copy</span></button>
            <button className="app-ghost-btn" onClick={scan} disabled={busy === 'scan'}>
              {busy === 'scan' ? <Spinner size={15} /> : <Radar size={15} />}<span>Scan for copies</span>
            </button>
          </div>
          {err && <div className="app-error">{err}</div>}
        </div>
      </div>

      <div className="app-tabs">
        {TABS.map((t) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      <div className="app-card pd-tab-body">
        {tab === 'Overview' && (
          <div className="pd-overview">
            <div className="pd-stat"><span className="app-muted">Sightings</span><strong>{sightings.length}</strong></div>
            <div className="pd-stat"><span className="app-muted">Confirmed copies</span><strong>{sightings.filter((s) => s.confirmed).length}</strong></div>
            <div className="pd-stat"><span className="app-muted">Verifications</span><strong>{verifications.length}</strong></div>
            <div className="pd-stat"><span className="app-muted">Payload</span><strong>#{image.payload}</strong></div>
          </div>
        )}

        {tab === 'Verifications' && (
          verifications.length === 0
            ? <EmptyState icon={BadgeCheck} title="No verifications for this property yet" />
            : (
              <ul className="pd-list">
                {verifications.map((v) => (
                  <li key={v.id}>
                    <span className={`app-pill ${v.result === 'matched' ? 'success' : 'neutral'}`}>{v.result.replace('_', ' ')}</span>
                    <span className="pd-list-main">{v.message}</span>
                    <span className="app-muted">{formatDateTime(v.createdAt)}</span>
                    <button className="app-row-btn" onClick={() => downloadReport(v.id)} aria-label="Report"><Download size={15} /></button>
                  </li>
                ))}
              </ul>
            )
        )}

        {tab === 'Sightings' && (
          sightings.length === 0
            ? <EmptyState icon={Radar} title="No copies found yet">Run “Scan for copies” to search the web.</EmptyState>
            : (
              <ul className="pd-list">
                {sightings.map((s) => (
                  <li key={s.id}>
                    <span className={`app-pill ${s.confirmed ? 'success' : 'neutral'}`}>{s.confirmed ? 'Confirmed' : 'Visual'}</span>
                    <a className="pd-list-main" href={s.pageUrl} target="_blank" rel="noreferrer">{s.pageUrl} <ExternalLink size={12} /></a>
                    <span className="app-muted">{formatDate(s.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )
        )}

        {tab === 'Evidence' && (
          verifications.length === 0
            ? <EmptyState icon={Download} title="No evidence records yet">Verifications of this property will appear here as downloadable reports.</EmptyState>
            : (
              <ul className="pd-list">
                {verifications.map((v) => (
                  <li key={v.id}>
                    <span className="pd-list-main">Report · {v.result.replace('_', ' ')} · {formatDate(v.createdAt)}</span>
                    <button className="app-ghost-btn" onClick={() => downloadReport(v.id)}><Download size={14} /><span>Export</span></button>
                  </li>
                ))}
              </ul>
            )
        )}
      </div>
    </div>
  );
}
