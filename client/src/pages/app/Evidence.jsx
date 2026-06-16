import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileText, Radar, ShieldCheck } from 'lucide-react';
import api from '../../api.js';
import {
  EmptyState, Spinner, downloadBlob, formatDateTime,
} from '../../components/ui/widgets.jsx';

const TONE = { matched: 'success', unknown_owner: 'warning', not_found: 'neutral', invalid: 'danger' };

export default function Evidence() {
  const [verifications, setVerifications] = useState([]);
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([api.get('/verify'), api.get('/images/sightings')])
      .then(([ver, sig]) => {
        if (ver.status === 'fulfilled') setVerifications(ver.value.data.verifications || []);
        if (sig.status === 'fulfilled') setSightings(sig.value.data.sightings || []);
        setLoading(false);
      });
  }, []);

  const downloadReport = async (id) => {
    const res = await api.get(`/verify/${id}/report`, { responseType: 'blob' });
    downloadBlob(res.data, `proofmark-verification-${id}.md`);
  };

  if (loading) return <div className="app-loading"><Spinner size={26} /></div>;

  const confirmedSightings = sightings.filter((s) => s.confirmed);

  return (
    <div className="app-page-head">
      <div>
        <h2>Evidence</h2>
        <p className="app-muted">Verification records and confirmed sighting proofs, ready to export.</p>
      </div>

      <div className="app-stat-row">
        <div className="app-card app-stat">
          <span className="app-stat-icon"><FileText size={18} /></span>
          <strong>{verifications.length}</strong><span className="app-muted">Verification records</span>
        </div>
        <div className="app-card app-stat">
          <span className="app-stat-icon"><ShieldCheck size={18} /></span>
          <strong>{verifications.filter((v) => v.result === 'matched').length}</strong>
          <span className="app-muted">Confirmed matches</span>
        </div>
        <div className="app-card app-stat">
          <span className="app-stat-icon"><Radar size={18} /></span>
          <strong>{confirmedSightings.length}</strong><span className="app-muted">Confirmed sightings</span>
        </div>
      </div>

      <section className="app-card">
        <div className="app-card-head"><h3>Verification records</h3></div>
        {verifications.length === 0 ? (
          <EmptyState icon={FileText} title="No evidence yet">
            Verify a copy to generate your first downloadable evidence report.
          </EmptyState>
        ) : (
          <ul className="pd-list">
            {verifications.map((v) => (
              <li key={v.id}>
                <span className={`app-pill ${TONE[v.result] || 'neutral'}`}>{v.result.replace('_', ' ')}</span>
                <span className="pd-list-main">
                  {v.image ? <Link to={`/app/properties/${v.image.id}`}>{v.image.title}</Link> : (v.message || 'Verification')}
                </span>
                <span className="app-muted">{formatDateTime(v.createdAt)}</span>
                <button className="app-ghost-btn" onClick={() => downloadReport(v.id)}>
                  <Download size={14} /><span>Export</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {confirmedSightings.length > 0 && (
        <section className="app-card">
          <div className="app-card-head"><h3>Confirmed sighting proofs</h3></div>
          <ul className="pd-list">
            {confirmedSightings.map((s) => (
              <li key={s.id}>
                <span className="app-pill success">Confirmed</span>
                <a className="pd-list-main" href={s.pageUrl} target="_blank" rel="noreferrer">{s.pageUrl}</a>
                <span className="app-muted">{s.image?.title || '—'}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
