import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  BadgeCheck,
  CircleHelp,
  CircleMinus,
  Download,
  FileVideo,
  Fingerprint,
  Image,
  Link as LinkIcon,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import api from '../../api.js';
import {
  Dropzone, EmptyState, Spinner, downloadBlob, formatDate, formatDateTime,
} from '../../components/ui/widgets.jsx';

const OUTCOME = {
  matched: { icon: BadgeCheck, title: 'Matched your video', tone: 'success' },
  unknown_owner: { icon: CircleHelp, title: 'Watermark found - not yours', tone: 'warning' },
  not_found: { icon: CircleMinus, title: 'No ProofMark found', tone: 'neutral' },
  invalid: { icon: AlertCircle, title: 'Could not verify', tone: 'danger' },
};

const evidenceValue = (value, fallback = '-') => {
  if (value === null || value === undefined || value === '') return fallback;
  return value;
};

export default function VerifyVideo() {
  const navigate = useNavigate();
  const [method, setMethod] = useState('upload');
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [job, setJob] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState('');

  const loadHistory = () => api.get('/verify/video')
    .then(({ data }) => setHistory(data.verifications || []))
    .catch(() => setHistory([]));

  useEffect(() => { loadHistory(); }, []);

  const pollJob = async (jobId) => {
    for (let i = 0; i < 120; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 4000));
      // eslint-disable-next-line no-await-in-loop
      const { data } = await api.get(`/verify/video/jobs/${jobId}`);
      setJob(data.job || null);
      if (data.verification) return data.verification;
      if (data.job?.status === 'error') throw new Error(data.job.error || 'Video verification failed');
      setStatusText(`Checking frames${i > 4 ? ' - still working' : ''}`);
    }
    throw new Error('Video verification is still processing. Check history shortly.');
  };

  const verify = async (e) => {
    e.preventDefault();
    setErr('');
    setResult(null);
    setJob(null);
    setBusy(true);
    setStatusText(method === 'upload' ? 'Uploading suspect video' : 'Submitting video URL');
    try {
      let data;
      if (method === 'url') {
        ({ data } = await api.post('/verify/video/url', { url }));
      } else {
        const fd = new FormData();
        fd.append('video', file);
        ({ data } = await api.post('/verify/video', fd));
      }
      setJob(data.job || null);
      const verification = await pollJob(data.job.id);
      setResult(verification);
      loadHistory();
    } catch (e2) {
      setErr(e2.response?.data?.message || e2.response?.data?.error || e2.message || 'Video verify failed');
    } finally {
      setBusy(false);
      setStatusText('');
    }
  };

  const downloadReport = async (id) => {
    try {
      const res = await api.get(`/verify/${id}/report`, { responseType: 'blob' });
      downloadBlob(res.data, `proofmark-video-verification-${id}.md`);
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Could not download report');
    }
  };

  const status = result?.result || 'not_found';
  const meta = OUTCOME[status] || OUTCOME.invalid;
  const ResultIcon = meta.icon;
  const detected = result?.evidence?.detected || result?.detected || {};

  return (
    <div className="app-page-head">
      <div>
        <h2>Verify a video</h2>
        <p className="app-muted">Check whether a suspect video contains one of your ProofMark forensic payloads.</p>
      </div>
      <div className="app-segment media-switch">
        <button type="button" onClick={() => navigate('/app/verify')}>
          <Image size={15} /> Image
        </button>
        <button type="button" className="active">
          <FileVideo size={15} /> Video
        </button>
      </div>

      <div className="verify-grid">
        <form className="app-card verify-form" onSubmit={verify}>
          <div className="app-segment">
            <button type="button" className={method === 'upload' ? 'active' : ''} onClick={() => setMethod('upload')}>
              <UploadCloud size={15} /> Upload
            </button>
            <button type="button" className={method === 'url' ? 'active' : ''} onClick={() => setMethod('url')}>
              <LinkIcon size={15} /> URL
            </button>
          </div>

          {method === 'upload' ? (
            <Dropzone
              file={file}
              onFile={setFile}
              accept="video/*"
              label="Drop the suspect video to check"
              hint="MP4, MOV or WEBM - detection runs as a job"
              previewType="video"
            />
          ) : (
            <>
              <label className="app-label" htmlFor="verify-video-url">Public video URL</label>
              <input
                id="verify-video-url"
                className="app-input"
                type="url"
                placeholder="https://example.com/suspect-video.mp4"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <p className="app-muted app-hint">Use direct downloadable URLs first. Platform-specific tracking comes later.</p>
            </>
          )}

          {job && (
            <div className="video-job-card">
              <span><FileVideo size={15} /> Detection job {job.status}</span>
              <strong>{job.fpwmJobId || job.id}</strong>
            </div>
          )}

          {err && <div className="app-error">{err}</div>}
          <button className="app-primary-btn" disabled={busy || (method === 'upload' ? !file : !url)}>
            {busy ? <Spinner /> : <ShieldCheck size={16} />}
            <span>{busy ? (statusText || 'Checking video') : 'Verify video'}</span>
          </button>
        </form>

        <div className="verify-result-wrap">
          {result ? (
            <div className={`app-card verify-result ${meta.tone}`}>
              <div className="verify-result-head">
                <span className="verify-result-icon"><ResultIcon size={22} /></span>
                <div>
                  <h3>{meta.title}</h3>
                  <p className="app-muted">{result.message}</p>
                </div>
              </div>

              {result.match && (
                <Link className="verify-match video-match" to={`/app/videos/${result.match.id}`}>
                  <video src={result.match.protectedUrl} muted playsInline />
                  <div>
                    <strong>{result.match.title}</strong>
                    <span className="app-muted"><Fingerprint size={13} /> #{result.match.payload}</span>
                    <span className="app-muted">Protected {formatDate(result.match.createdAt)}</span>
                  </div>
                </Link>
              )}

              <div className="verify-evidence video-evidence-grid">
                <div><span>Detected payload</span><strong>{evidenceValue(detected.payload)}</strong></div>
                <div><span>Confidence</span><strong>{detected.confidence != null ? `${Math.round(detected.confidence * 100)}%` : '-'}</strong></div>
                <div><span>Frames voted</span><strong>{evidenceValue(detected.framesVoted ?? detected.frames_voted)}</strong></div>
                <div><span>Engine</span><strong>{evidenceValue(detected.engine)}</strong></div>
                <div><span>Audio</span><strong>{detected.audioCorroborated ? 'Corroborated' : 'Not used'}</strong></div>
                <div><span>Strict result</span><strong>{result.result.replace('_', ' ')}</strong></div>
              </div>

              {result.id && (
                <button className="app-ghost-btn" onClick={() => downloadReport(result.id)}>
                  <Download size={15} /><span>Download evidence report</span>
                </button>
              )}
            </div>
          ) : (
            <div className="app-card verify-placeholder">
              <EmptyState icon={FileVideo} title="Video verification result">
                Upload a suspicious copy or paste a direct URL. We will report frame-vote evidence when detection finishes.
              </EmptyState>
            </div>
          )}
        </div>
      </div>

      <section className="app-card">
        <div className="app-card-head"><h3>Recent video verifications</h3></div>
        {history.length === 0 ? (
          <EmptyState icon={BadgeCheck} title="No video verifications yet" />
        ) : (
          <div className="app-table-wrap">
            <table className="app-table verify-history">
              <thead>
                <tr><th>Result</th><th>Video</th><th>Payload</th><th>When</th><th /></tr>
              </thead>
              <tbody>
                {history.map((v) => (
                  <tr key={v.id}>
                    <td><span className={`app-pill ${OUTCOME[v.result]?.tone || 'neutral'}`}>{v.result.replace('_', ' ')}</span></td>
                    <td>{v.asset?.title || '-'}</td>
                    <td>{v.detectedPayload || '-'}</td>
                    <td className="app-muted">{formatDateTime(v.createdAt)}</td>
                    <td>
                      <button className="app-row-btn" onClick={() => downloadReport(v.id)} aria-label="Download report">
                        <Download size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
