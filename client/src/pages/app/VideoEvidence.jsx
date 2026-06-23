import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowDownToLine,
  ArrowLeft,
  BadgeCheck,
  Download,
  ExternalLink,
  FileVideo,
  Fingerprint,
  Radar,
  ShieldCheck,
} from 'lucide-react';
import api from '../../api.js';
import {
  EmptyState, Spinner, downloadBlob, formatDate, formatDateTime,
} from '../../components/ui/widgets.jsx';

const TABS = ['Overview', 'Verifications', 'Sightings', 'Evidence'];
const TONE = { matched: 'success', unknown_owner: 'warning', not_found: 'neutral', invalid: 'danger' };

export default function VideoEvidence() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [sightings, setSightings] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [tab, setTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  const load = () => api.get(`/videos/${id}/evidence`)
    .then(({ data }) => {
      setVideo(data.video);
      setSightings(data.sightings || []);
      setVerifications(data.verifications || []);
    })
    .catch((e) => setErr(e.response?.data?.message || 'Could not load video evidence'))
    .finally(() => setLoading(false));

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  const downloadVideo = async () => {
    setBusy('download');
    try {
      const res = await api.get(`/videos/${id}/download`, { responseType: 'blob' });
      downloadBlob(res.data, `${video?.title || 'proofmark-video'}-protected.mp4`);
    } catch (e) {
      setErr(e.response?.data?.message || 'Download failed');
    } finally {
      setBusy('');
    }
  };

  const downloadReport = async (verificationId) => {
    const res = await api.get(`/verify/${verificationId}/report`, { responseType: 'blob' });
    downloadBlob(res.data, `proofmark-video-verification-${verificationId}.md`);
  };

  if (loading) return <div className="app-loading"><Spinner size={26} /></div>;
  if (!video) {
    return (
      <div className="app-card">
        <EmptyState
          icon={FileVideo}
          title="Video not found"
          action={<Link className="app-ghost-btn" to="/app/protect-video">Protect a video</Link>}
        >
          {err || 'This protected video could not be loaded.'}
        </EmptyState>
      </div>
    );
  }

  const metrics = video.metadata?.metrics || {};

  return (
    <div className="pd">
      <Link className="app-back" to="/app/protect-video"><ArrowLeft size={16} /> Protect video</Link>

      <div className="app-card pd-hero video-evidence-hero">
        <video className="pd-hero-video" src={video.protectedUrl} controls playsInline />
        <div className="pd-hero-body">
          <span className={`app-pill ${video.status === 'ready' ? 'success' : 'neutral'}`}>
            <BadgeCheck size={13} /> {video.status}
          </span>
          <h2>{video.title}</h2>
          <div className="pd-meta">
            <span><Fingerprint size={14} /> Payload #{video.payload}</span>
            <span>Engine: {video.engine}</span>
            <span>Protected {formatDate(video.createdAt)}</span>
            {video.durationSeconds && <span>{Math.round(video.durationSeconds)}s</span>}
          </div>
          <div className="pd-actions">
            <button className="app-primary-btn" onClick={downloadVideo} disabled={busy === 'download' || video.status !== 'ready'}>
              {busy === 'download' ? <Spinner size={15} /> : <ArrowDownToLine size={15} />}<span>Download</span>
            </button>
            <button className="app-ghost-btn" onClick={() => navigate('/app/verify-video')}>
              <ShieldCheck size={15} /><span>Verify copy</span>
            </button>
            <button className="app-ghost-btn" onClick={() => navigate('/app/tracking')}>
              <Radar size={15} /><span>Track URL</span>
            </button>
          </div>
          {err && <div className="app-error">{err}</div>}
        </div>
      </div>

      <div className="app-tabs">
        {TABS.map((item) => (
          <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>
        ))}
      </div>

      <div className="app-card pd-tab-body">
        {tab === 'Overview' && (
          <div className="pd-overview">
            <div className="pd-stat"><span className="app-muted">Sightings</span><strong>{sightings.length}</strong></div>
            <div className="pd-stat"><span className="app-muted">Confirmed copies</span><strong>{sightings.filter((s) => s.confirmed).length}</strong></div>
            <div className="pd-stat"><span className="app-muted">Verifications</span><strong>{verifications.length}</strong></div>
            <div className="pd-stat"><span className="app-muted">Frames marked</span><strong>{metrics.frames_marked || metrics.framesMarked || '-'}</strong></div>
          </div>
        )}

        {tab === 'Verifications' && (
          verifications.length === 0
            ? <EmptyState icon={ShieldCheck} title="No verifications for this video yet" />
            : (
              <ul className="pd-list">
                {verifications.map((verification) => (
                  <li key={verification.id}>
                    <span className={`app-pill ${TONE[verification.result] || 'neutral'}`}>{verification.result.replace('_', ' ')}</span>
                    <span className="pd-list-main">{verification.message}</span>
                    <span className="app-muted">{formatDateTime(verification.createdAt)}</span>
                    <button className="app-row-btn" onClick={() => downloadReport(verification.id)} aria-label="Report">
                      <Download size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )
        )}

        {tab === 'Sightings' && (
          sightings.length === 0
            ? <EmptyState icon={Radar} title="No video sightings yet">Check a direct video URL to create the first tracking record.</EmptyState>
            : (
              <ul className="pd-list">
                {sightings.map((sighting) => (
                  <li key={sighting.id}>
                    <span className={`app-pill ${sighting.confirmed ? 'success' : 'neutral'}`}>{sighting.confirmed ? 'Confirmed' : 'Unconfirmed'}</span>
                    <a className="pd-list-main" href={sighting.pageUrl} target="_blank" rel="noreferrer">
                      {sighting.pageUrl} <ExternalLink size={12} />
                    </a>
                    <span className="app-muted">{formatDate(sighting.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )
        )}

        {tab === 'Evidence' && (
          verifications.length === 0
            ? <EmptyState icon={Download} title="No evidence exports yet">Video verification reports will appear here after checks.</EmptyState>
            : (
              <ul className="pd-list">
                {verifications.map((verification) => (
                  <li key={verification.id}>
                    <span className="pd-list-main">Report - {verification.result.replace('_', ' ')} - {formatDate(verification.createdAt)}</span>
                    <button className="app-ghost-btn" onClick={() => downloadReport(verification.id)}>
                      <Download size={14} /><span>Export</span>
                    </button>
                  </li>
                ))}
              </ul>
            )
        )}
      </div>
    </div>
  );
}
