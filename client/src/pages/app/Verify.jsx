import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  BadgeCheck,
  CircleHelp,
  CircleMinus,
  Download,
  Fingerprint,
  Link as LinkIcon,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import api from '../../api.js';
import {
  Dropzone, EmptyState, Spinner, downloadBlob, formatDate, formatDateTime,
} from '../../components/ui/widgets.jsx';

const OUTCOME = {
  matched: { icon: BadgeCheck, title: 'Matched your property', tone: 'success' },
  unknown_owner: { icon: CircleHelp, title: 'Watermark found — not yours', tone: 'warning' },
  not_found: { icon: CircleMinus, title: 'No ProofMark found', tone: 'neutral' },
  invalid: { icon: AlertCircle, title: 'Could not verify', tone: 'danger' },
};

export default function Verify() {
  const [method, setMethod] = useState('upload');
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const loadHistory = () => api.get('/verify')
    .then(({ data }) => setHistory(data.verifications || []))
    .catch(() => setHistory([]));

  useEffect(() => { loadHistory(); }, []);

  const verify = async (e) => {
    e.preventDefault();
    setErr('');
    setResult(null);
    setBusy(true);
    try {
      let data;
      if (method === 'url') {
        ({ data } = await api.post('/verify/url', { url }));
      } else {
        const fd = new FormData();
        fd.append('image', file);
        ({ data } = await api.post('/verify', fd));
      }
      setResult(data);
      loadHistory();
    } catch (e2) {
      setErr(e2.response?.data?.message || e2.response?.data?.error || 'Verify failed');
    } finally {
      setBusy(false);
    }
  };

  const downloadReport = async (id) => {
    try {
      const res = await api.get(`/verify/${id}/report`, { responseType: 'blob' });
      downloadBlob(res.data, `proofmark-verification-${id}.md`);
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Could not download report');
    }
  };

  const status = result?.result || (result?.watermarked ? (result?.mine ? 'matched' : 'unknown_owner') : 'not_found');
  const meta = OUTCOME[status] || OUTCOME.invalid;
  const ResultIcon = meta.icon;

  return (
    <div className="app-page-head">
      <div>
        <h2>Verify a copy</h2>
        <p className="app-muted">Check whether a suspect image is one of your protected ProofMark images.</p>
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
            <Dropzone file={file} onFile={setFile} hint="Drop the suspect image to check" />
          ) : (
            <>
              <label className="app-label" htmlFor="verify-url">Public image URL</label>
              <input
                id="verify-url"
                className="app-input"
                type="url"
                placeholder="https://example.com/suspect-image.jpg"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <p className="app-muted app-hint">A confirmed match from a URL is also recorded as a sighting.</p>
            </>
          )}

          {err && <div className="app-error">{err}</div>}
          <button className="app-primary-btn" disabled={busy || (method === 'upload' ? !file : !url)}>
            {busy ? <Spinner /> : <ShieldCheck size={16} />}
            <span>{busy ? 'Checking…' : 'Verify image'}</span>
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
                <Link className="verify-match" to={`/app/properties/${result.match.id}`}>
                  <img src={result.match.watermarkedUrl} alt={result.match.title} />
                  <div>
                    <strong>{result.match.title}</strong>
                    <span className="app-muted"><Fingerprint size={13} /> #{result.match.payload}</span>
                    <span className="app-muted">Protected {formatDate(result.match.createdAt)}</span>
                  </div>
                </Link>
              )}

              <div className="verify-evidence">
                <div><span>Detected payload</span><strong>{result.detected?.payload || '—'}</strong></div>
                <div><span>Confidence</span><strong>{result.detected?.confidence != null ? `${Math.round(result.detected.confidence * 100)}%` : '—'}</strong></div>
                <div><span>Engine</span><strong>{result.detected?.engine || '—'}</strong></div>
              </div>

              {result.id && (
                <button className="app-ghost-btn" onClick={() => downloadReport(result.id)}>
                  <Download size={15} /><span>Download evidence report</span>
                </button>
              )}
            </div>
          ) : (
            <div className="app-card verify-placeholder">
              <EmptyState icon={ShieldCheck} title="Verification result">
                Upload a copy or paste a URL. We only claim ownership on a real forensic match.
              </EmptyState>
            </div>
          )}
        </div>
      </div>

      <section className="app-card">
        <div className="app-card-head"><h3>Recent verifications</h3></div>
        {history.length === 0 ? (
          <EmptyState icon={BadgeCheck} title="No verifications yet" />
        ) : (
          <div className="app-table-wrap">
            <table className="app-table verify-history">
              <thead>
                <tr><th>Result</th><th>Property</th><th>Payload</th><th>When</th><th /></tr>
              </thead>
              <tbody>
                {history.map((v) => (
                  <tr key={v.id}>
                    <td><span className={`app-pill ${OUTCOME[v.result]?.tone || 'neutral'}`}>{v.result.replace('_', ' ')}</span></td>
                    <td>{v.image?.title || '—'}</td>
                    <td>{v.detectedPayload || '—'}</td>
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
