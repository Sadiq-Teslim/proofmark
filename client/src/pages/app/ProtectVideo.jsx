import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownToLine,
  BadgeCheck,
  Check,
  Clock3,
  FileVideo,
  Fingerprint,
  Image,
  PlayCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import api from '../../api.js';
import { Dropzone, Spinner, downloadBlob } from '../../components/ui/widgets.jsx';
import { protectionLevelName } from '../../protectionLevels.js';

const VIDEO_RESILIENCE = [
  'H.264 recompression',
  'Platform re-upload workflows',
  'Resize and bitrate changes',
  'Frame-vote evidence for verification',
];

export default function ProtectVideo() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [engine, setEngine] = useState('qim-dct');
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [err, setErr] = useState('');
  const [result, setResult] = useState(null);
  const [job, setJob] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const pollJob = async (jobId) => {
    for (let i = 0; i < 120; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 4000));
      // eslint-disable-next-line no-await-in-loop
      const { data } = await api.get(`/videos/jobs/${jobId}`);
      setJob(data.job || null);
      if (data.job?.status === 'ready' && data.video) return data.video;
      if (data.job?.status === 'error') throw new Error(data.job.error || 'Video protection failed');
      setStatusText(`Processing video${i > 4 ? ' - still working' : ''}`);
    }
    throw new Error('Video protection is still processing. Check the jobs list shortly.');
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setResult(null);
    setJob(null);
    setBusy(true);
    setStatusText('Uploading original video');
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('engine', engine);
      fd.append('video', file);
      const { data } = await api.post('/videos', fd);
      setJob(data.job || null);
      setStatusText('Embedding forensic video payload');
      const video = await pollJob(data.job.id);
      setResult(video);
      setTitle('');
      setFile(null);
    } catch (e2) {
      setErr(e2.response?.data?.message || e2.response?.data?.error || e2.message || 'Video protection failed');
    } finally {
      setBusy(false);
      setStatusText('');
    }
  };

  const download = async () => {
    if (!result) return;
    setDownloading(true);
    setErr('');
    try {
      const res = await api.get(`/videos/${result.id}/download`, { responseType: 'blob' });
      downloadBlob(res.data, `${result.title || 'proofmark-video'}-protected.mp4`);
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="app-page-head">
      <div className="app-page-head-row">
        <div>
          <h2>Protect a video</h2>
          <p className="app-muted">Upload a video and generate the protected version you will publish or send.</p>
        </div>
      </div>
      <div className="app-segment media-switch">
        <button type="button" onClick={() => navigate('/app/protect')}>
          <Image size={15} /> Image
        </button>
        <button type="button" className="active">
          <FileVideo size={15} /> Video
        </button>
      </div>

      <div className="protect-grid video-flow-grid">
        <form className="app-card protect-form" onSubmit={submit}>
          <label className="app-label" htmlFor="video-title">Property name</label>
          <input
            id="video-title"
            className="app-input"
            placeholder="Music video, campaign reel, proof clip..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <label className="app-label">Video file</label>
          <Dropzone
            file={file}
            onFile={setFile}
            accept="video/*"
            label="Drop a video or click to upload"
            hint="MP4, MOV or WEBM - up to your configured limit"
            previewType="video"
          />

          <label className="app-label">Protection level</label>
          <div className="protect-modes">
            <button
              type="button"
              className={`protect-mode ${engine === 'qim-dct' ? 'active' : ''}`}
              onClick={() => setEngine('qim-dct')}
            >
              <ShieldCheck size={18} />
              <div>
                <strong>ProofMark Standard</strong>
                <span>Reliable protection for everyday video publishing and reposting</span>
              </div>
              {engine === 'qim-dct' && <Check className="protect-mode-check" size={18} />}
            </button>
            <button
              type="button"
              className="protect-mode disabled"
              disabled
              title="ProofMark Advanced for video is coming soon"
            >
              <Sparkles size={18} />
              <div>
                <strong>ProofMark Advanced · coming soon</strong>
                <span>Stronger protection for heavily edited and transformed videos</span>
              </div>
            </button>
          </div>

          {job && (
            <div className="video-job-card">
              <span><Clock3 size={15} /> Job {job.status}</span>
              <strong>{job.fpwmJobId || job.id}</strong>
            </div>
          )}

          {err && <div className="app-error">{err}</div>}

          <button className="app-primary-btn protect-submit" disabled={busy || !file || !title}>
            {busy ? <Spinner /> : <FileVideo size={16} />}
            <span>{busy ? (statusText || 'Protecting video') : 'Create protected video'}</span>
          </button>
        </form>

        <aside className="protect-side">
          {result ? (
            <div className="app-card protect-result video-result">
              <span className="app-pill success"><BadgeCheck size={14} /> Protected video</span>
              <video src={result.protectedUrl} className="protect-result-video" controls playsInline />
              <h3>{result.title}</h3>
              <p className="app-muted"><Fingerprint size={14} /> Payload #{result.payload}</p>
              <div className="verify-evidence">
                <div><span>Protection level</span><strong>{protectionLevelName(result.engine)}</strong></div>
                <div><span>Status</span><strong>{result.status}</strong></div>
                <div><span>Duration</span><strong>{result.durationSeconds ? `${Math.round(result.durationSeconds)}s` : '-'}</strong></div>
              </div>
              <div className="protect-result-actions">
                <button className="app-primary-btn" onClick={download} disabled={downloading}>
                  {downloading ? <Spinner size={15} /> : <ArrowDownToLine size={15} />}
                  <span>Download</span>
                </button>
                <button className="app-ghost-btn" onClick={() => navigate('/app/verify-video')}>
                  <BadgeCheck size={15} /><span>Verify copy</span>
                </button>
                <button className="app-ghost-btn" onClick={() => navigate(`/app/videos/${result.id}`)}>
                  <Fingerprint size={15} /><span>Evidence</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="app-card protect-info">
                <h3>How video protection works</h3>
                <ol className="protect-steps">
                  <li><span>1</span> We store the original and allocate a ProofMark payload.</li>
                  <li><span>2</span> FPWM embeds that payload across sampled video frames.</li>
                  <li><span>3</span> The protected video becomes downloadable when the job finishes.</li>
                </ol>
              </div>
              <div className="app-card protect-info">
                <h3>V1 standard resilience</h3>
                <ul className="protect-resilience">
                  {VIDEO_RESILIENCE.map((item) => (
                    <li key={item}><Check size={15} /> {item}</li>
                  ))}
                </ul>
              </div>
              <div className="app-card protect-privacy">
                <PlayCircle size={16} />
                <p>Video jobs are async by design. This is the same pattern FairPlay should use for full media workflows.</p>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
