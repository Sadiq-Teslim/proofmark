import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowDownToLine, BadgeCheck, ImagePlus, LayoutGrid, List, Radar,
} from 'lucide-react';
import api from '../../api.js';
import { EmptyState, Spinner, downloadBlob, formatDate } from '../../components/ui/widgets.jsx';

export default function Properties() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid');
  const [downloading, setDownloading] = useState({});
  const query = params.get('q') || '';

  useEffect(() => {
    api.get('/images')
      .then(({ data }) => setImages(data.images || []))
      .catch(() => setImages([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return images;
    return images.filter((i) =>
      i.title?.toLowerCase().includes(q) || String(i.payload).includes(q));
  }, [images, query]);

  const download = async (img) => {
    setDownloading((s) => ({ ...s, [img.id]: true }));
    try {
      const res = await api.get(`/images/${img.id}/download`, { responseType: 'blob' });
      downloadBlob(res.data, `${img.title || 'proofmark'}-protected.png`);
    } catch {
      /* ignore */
    } finally {
      setDownloading((s) => ({ ...s, [img.id]: false }));
    }
  };

  if (loading) return <div className="app-loading"><Spinner size={26} /></div>;

  return (
    <div className="app-page-head">
      <div className="app-page-head-row">
        <div>
          <h2>Properties</h2>
          <p className="app-muted">{images.length} protected image{images.length === 1 ? '' : 's'}.</p>
        </div>
        <div className="props-controls">
          <input
            className="app-input props-search"
            placeholder="Search by name or payload…"
            value={query}
            onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {})}
          />
          <div className="app-segment app-segment-sm">
            <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')} aria-label="Grid view"><LayoutGrid size={15} /></button>
            <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} aria-label="List view"><List size={15} /></button>
          </div>
          <button className="app-primary-btn" onClick={() => navigate('/app/protect')}>
            <ImagePlus size={15} /><span>Protect</span>
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="app-card">
          <EmptyState
            icon={ImagePlus}
            title={query ? 'No matches' : 'No protected images yet'}
            action={!query && (
              <button className="app-primary-btn" onClick={() => navigate('/app/protect')}>
                Protect your first image
              </button>
            )}
          >
            {query ? `Nothing matches “${query}”.` : 'Protect an image to build your library.'}
          </EmptyState>
        </div>
      ) : (
        <div className={view === 'grid' ? 'props-grid' : 'props-list'}>
          {filtered.map((img) => (
            <div className={`app-card prop-card ${view}`} key={img.id}>
              <Link to={`/app/properties/${img.id}`} className="prop-thumb">
                <img src={img.watermarkedUrl} alt={img.title} loading="lazy" />
              </Link>
              <div className="prop-body">
                <Link to={`/app/properties/${img.id}`} className="prop-title">{img.title}</Link>
                <span className="app-muted">#{img.payload} · {formatDate(img.createdAt)}</span>
                <div className="prop-actions">
                  <button className="app-row-btn" title="Download" onClick={() => download(img)} disabled={downloading[img.id]}>
                    {downloading[img.id] ? <Spinner size={15} /> : <ArrowDownToLine size={15} />}
                  </button>
                  <button className="app-row-btn" title="Verify" onClick={() => navigate('/app/verify')}><BadgeCheck size={15} /></button>
                  <button className="app-row-btn" title="Track" onClick={() => navigate('/app/tracking')}><Radar size={15} /></button>
                  <Link className="app-ghost-btn prop-details" to={`/app/properties/${img.id}`}>Details</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
