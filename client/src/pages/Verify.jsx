import { useEffect, useState } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  CalendarClock,
  Download,
  FileImage,
  Fingerprint,
  History,
  Link as LinkIcon,
  Loader2,
  SearchCheck,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import api from '../api.js';

const confidenceText = (value) => {
  if (value === undefined || value === null) return 'Not reported';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return `${Math.round(numeric * 100)}%`;
};

const resultCopy = {
  matched: {
    icon: BadgeCheck,
    title: 'Matched your property',
    tone: 'success',
  },
  unknown_owner: {
    icon: ShieldAlert,
    title: 'ProofMark detected, but not yours',
    tone: 'warning',
  },
  not_found: {
    icon: AlertCircle,
    title: 'No ProofMark found',
    tone: 'neutral',
  },
  invalid: {
    icon: AlertCircle,
    title: 'Verification could not be completed',
    tone: 'warning',
  },
};

export default function Verify() {
  const [method, setMethod] = useState('upload');
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const loadHistory = async () => {
    try {
      const { data } = await api.get('/verify');
      setHistory(data.verifications || []);
    } catch {
      setHistory([]);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  const verify = async (e) => {
    e.preventDefault();
    setErr('');
    setResult(null);
    setBusy(true);
    try {
      let data;
      if (method === 'url') {
        const response = await api.post('/verify/url', { url: imageUrl });
        data = response.data;
      } else {
        const fd = new FormData();
        fd.append('image', file);
        const response = await api.post('/verify', fd);
        data = response.data;
      }
      setResult(data);
      await loadHistory();
    } catch (e2) {
      setErr(e2.response?.data?.error || e2.response?.data?.message || 'Verify failed');
    } finally {
      setBusy(false);
    }
  };

  const downloadReport = async (id) => {
    try {
      const response = await api.get(`/verify/${id}/report`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `proofmark-verification-${id}.md`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Could not download report');
    }
  };

  const currentStatus = result?.result || (result?.watermarked && result?.mine ? 'matched' : result?.watermarked ? 'unknown_owner' : 'not_found');
  const presentation = resultCopy[currentStatus] || resultCopy.invalid;
  const ResultIcon = presentation.icon;

  return (
    <main className="page-stack verify-page">
      <section className="verify-hero">
        <div>
          <span className="eyebrow"><Fingerprint size={16} /> Verification</span>
          <h1>Verify a copied image against your properties.</h1>
          <p>
            Upload a suspect image or paste a public image URL. ProofMark checks for a valid
            watermark, matches it to your protected images, and prepares evidence when it belongs to you.
          </p>
        </div>
        <form className="verify-panel" onSubmit={verify}>
          <div className="panel-heading">
            <span className="panel-icon"><SearchCheck size={20} /></span>
            <div>
              <h2>Check a copy</h2>
              <p>Use the file you found online, in chat, or from a repost.</p>
            </div>
          </div>
          <div className="segmented-control" aria-label="Verification method">
            <button
              type="button"
              className={method === 'upload' ? 'active' : ''}
              onClick={() => setMethod('upload')}
            >
              <UploadCloud size={16} />
              <span>Upload</span>
            </button>
            <button
              type="button"
              className={method === 'url' ? 'active' : ''}
              onClick={() => setMethod('url')}
            >
              <LinkIcon size={16} />
              <span>URL</span>
            </button>
          </div>

          {method === 'upload' ? (
            <>
              <label htmlFor="verify-image">Image to verify</label>
              <label className="drop-zone compact" htmlFor="verify-image">
                <UploadCloud size={24} />
                <span>{file ? file.name : 'Choose suspect image'}</span>
              </label>
              <input
                id="verify-image"
                className="sr-only"
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files[0])}
                required={method === 'upload'}
              />
            </>
          ) : (
            <>
              <label htmlFor="verify-url">Public image URL</label>
              <input
                id="verify-url"
                type="url"
                placeholder="https://example.com/suspect-image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                required={method === 'url'}
              />
              <p className="helper-text">
                URL checks store evidence and create a confirmed sighting when the protected
                image is matched.
              </p>
            </>
          )}
          {err && <div className="err">{err}</div>}
          <button className="primary-button" disabled={busy || (method === 'upload' ? !file : !imageUrl)}>
            {busy ? <Loader2 className="spin" size={18} /> : <ShieldCheck size={18} />}
            <span>{busy ? 'Checking image' : 'Verify image'}</span>
          </button>
        </form>
      </section>

      {result && (
        <section className={`result-card ${presentation.tone}`}>
          <div className="result-icon"><ResultIcon size={24} /></div>
          <div className="result-content">
            <h2>{presentation.title}</h2>
            <p>{result.message || 'Verification complete.'}</p>

            {result.match && (
              <div className="match-card">
                <img src={result.match.watermarkedUrl} alt={result.match.title} />
                <div>
                  <strong>{result.match.title}</strong>
                  <span><CalendarClock size={14} /> Protected {new Date(result.match.createdAt).toLocaleString()}</span>
                  <span><Fingerprint size={14} /> Payload #{result.match.payload}</span>
                </div>
              </div>
            )}

            <div className="evidence-grid">
              <div>
                <span>Detected payload</span>
                <strong>{result.detected?.payload || result.detectedPayload || 'None'}</strong>
              </div>
              <div>
                <span>Confidence</span>
                <strong>{confidenceText(result.detected?.confidence || result.confidence)}</strong>
              </div>
              <div>
                <span>Engine</span>
                <strong>{result.detected?.engine || result.engine || 'Auto'}</strong>
              </div>
              <div>
                <span>Source</span>
                <strong>{result.evidence?.source || method}</strong>
              </div>
            </div>
            {result.id && (
              <button className="report-button" type="button" onClick={() => downloadReport(result.id)}>
                <Download size={17} />
                <span>Download evidence report</span>
              </button>
            )}
          </div>
        </section>
      )}

      <section className="section-heading">
        <div>
          <span className="eyebrow"><History size={16} /> Evidence</span>
          <h2>Recent checks</h2>
        </div>
      </section>

      {history.length === 0 ? (
        <div className="empty-state small">
          <FileImage size={30} />
          <h3>No verification history yet</h3>
          <p>Checks made from this account will appear here.</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => {
            const itemPresentation = resultCopy[item.result] || resultCopy.invalid;
            const ItemIcon = itemPresentation.icon;
            return (
              <article className="history-item" key={item.id}>
                <span className={`history-icon ${itemPresentation.tone}`}><ItemIcon size={17} /></span>
                <div>
                  <strong>{itemPresentation.title}</strong>
                  <p>{item.image?.title || item.suspectFilename || 'Uploaded image'}</p>
                </div>
                <button className="icon-button" type="button" onClick={() => downloadReport(item.id)} title="Download report">
                  <Download size={16} />
                </button>
                <time>{new Date(item.createdAt).toLocaleDateString()}</time>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
