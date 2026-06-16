import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  ImagePlus,
  Radar,
  ScanSearch,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import api from '../../api.js';
import { EmptyState, Spinner, formatDate, relativeTime } from '../../components/ui/widgets.jsx';

const STAT_META = [
  { key: 'protected', label: 'Protected images', icon: ShieldCheck },
  { key: 'matched', label: 'Verified matches', icon: BadgeCheck },
  { key: 'sightings', label: 'Sightings', icon: Radar },
  { key: 'open', label: 'Open investigations', icon: ScanSearch },
];

export default function Overview() {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      api.get('/images'),
      api.get('/verify'),
      api.get('/images/sightings'),
    ]).then(([img, ver, sig]) => {
      if (!active) return;
      if (img.status === 'fulfilled') setImages(img.value.data.images || []);
      if (ver.status === 'fulfilled') setVerifications(ver.value.data.verifications || []);
      if (sig.status === 'fulfilled') setSightings(sig.value.data.sightings || []);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const stats = useMemo(() => ({
    protected: images.length,
    matched: verifications.filter((v) => v.result === 'matched').length,
    sightings: sightings.length,
    open: sightings.filter((s) => !s.confirmed).length,
  }), [images, verifications, sightings]);

  const activity = useMemo(() => {
    const items = [
      ...images.map((i) => ({
        id: `i-${i.id}`, kind: 'protect', at: i.createdAt,
        text: `Protected “${i.title}”`, to: `/app/properties/${i.id}`,
      })),
      ...verifications.map((v) => ({
        id: `v-${v.id}`, kind: 'verify', at: v.createdAt,
        text: `Verification · ${v.result.replace('_', ' ')}`, to: '/app/evidence',
      })),
      ...sightings.map((s) => ({
        id: `s-${s.id}`, kind: 'sighting', at: s.createdAt,
        text: `Copy found${s.image ? ` of “${s.image.title}”` : ''}`, to: '/app/tracking',
      })),
    ];
    return items.sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 7);
  }, [images, verifications, sightings]);

  const attention = useMemo(() => [
    ...verifications
      .filter((v) => v.result === 'unknown_owner' || v.result === 'invalid')
      .map((v) => ({ id: `v-${v.id}`, text: v.message || 'Verification needs review', to: '/app/evidence' })),
    ...sightings
      .filter((s) => !s.confirmed)
      .map((s) => ({ id: `s-${s.id}`, text: `Unconfirmed copy${s.image ? ` of “${s.image.title}”` : ''}`, to: '/app/tracking' })),
  ].slice(0, 4), [verifications, sightings]);

  if (loading) {
    return <div className="app-loading"><Spinner size={26} /></div>;
  }

  return (
    <div className="ov">
      <div className="app-page-head-row">
        <div>
          <h2>Welcome back</h2>
          <p className="app-muted">Here&apos;s what&apos;s happening with your protected images.</p>
        </div>
        <button className="app-primary-btn" onClick={() => navigate('/app/protect')}>
          <ImagePlus size={16} /><span>Protect image</span>
        </button>
      </div>

      <div className="app-stat-row">
        {STAT_META.map((meta) => {
          const Icon = meta.icon;
          return (
            <div className="app-card app-stat" key={meta.key}>
              <span className="app-stat-icon"><Icon size={18} /></span>
              <strong>{stats[meta.key]}</strong>
              <span className="app-muted">{meta.label}</span>
            </div>
          );
        })}
      </div>

      <div className="ov-grid">
        <section className="app-card">
          <div className="app-card-head">
            <h3>Recent activity</h3>
          </div>
          {activity.length === 0 ? (
            <EmptyState icon={Sparkles} title="No activity yet">
              Protect your first image to get started.
            </EmptyState>
          ) : (
            <ul className="ov-feed">
              {activity.map((item) => (
                <li key={item.id}>
                  <Link to={item.to}>
                    <span className={`ov-dot ${item.kind}`} />
                    <span className="ov-feed-text">{item.text}</span>
                    <span className="app-muted">{relativeTime(item.at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="app-card ov-attention">
          <div className="app-card-head">
            <h3><AlertTriangle size={16} /> Needs attention</h3>
          </div>
          {attention.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="All clear">
              No unconfirmed copies or failed checks.
            </EmptyState>
          ) : (
            <ul className="ov-attention-list">
              {attention.map((item) => (
                <li key={item.id}>
                  <Link to={item.to}>
                    <span>{item.text}</span>
                    <ArrowRight size={15} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="app-card">
        <div className="app-card-head">
          <h3>Recent protected images</h3>
          <Link className="app-link" to="/app/properties">View all <ArrowRight size={14} /></Link>
        </div>
        {images.length === 0 ? (
          <EmptyState
            icon={ImagePlus}
            title="No protected images yet"
            action={(
              <button className="app-primary-btn" onClick={() => navigate('/app/protect')}>
                Protect your first image
              </button>
            )}
          />
        ) : (
          <div className="ov-recent">
            {images.slice(0, 4).map((img) => (
              <Link className="ov-recent-card" key={img.id} to={`/app/properties/${img.id}`}>
                <img src={img.watermarkedUrl} alt={img.title} loading="lazy" />
                <div>
                  <strong>{img.title}</strong>
                  <span className="app-muted">#{img.payload} · {formatDate(img.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="ov-quick">
        <button className="app-card ov-quick-card" onClick={() => navigate('/app/protect')}>
          <span className="app-stat-icon"><ImagePlus size={18} /></span>
          <strong>Protect new image</strong>
          <span className="app-muted">Upload &amp; watermark</span>
        </button>
        <button className="app-card ov-quick-card" onClick={() => navigate('/app/verify')}>
          <span className="app-stat-icon"><BadgeCheck size={18} /></span>
          <strong>Verify a copy</strong>
          <span className="app-muted">Check a suspect image</span>
        </button>
        <button className="app-card ov-quick-card" onClick={() => navigate('/app/tracking')}>
          <span className="app-stat-icon"><Radar size={18} /></span>
          <strong>Track an image</strong>
          <span className="app-muted">Find copies online</span>
        </button>
      </section>
    </div>
  );
}
