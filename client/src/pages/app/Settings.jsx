import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Lock, LogOut, ShieldCheck, User } from 'lucide-react';
import api from '../../api.js';
import { useAuth } from '../../auth.jsx';
import { Spinner } from '../../components/ui/widgets.jsx';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [caps, setCaps] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/images/capabilities')
      .then(({ data }) => setCaps(data.capabilities))
      .catch(() => setCaps(null))
      .finally(() => setLoading(false));
  }, []);

  const engines = caps?.engines || {};
  const standardOk = engines['qim-dct']?.available ?? false;
  const strongOk = engines.trustmark?.available ?? false;
  const engineConnected = caps?.source === 'engine';

  return (
    <div className="app-page-head set">
      <div>
        <h2>Settings</h2>
        <p className="app-muted">Manage your account, protection options, and privacy.</p>
      </div>

      <section className="app-card set-section">
        <div className="set-section-head"><User size={17} /><h3>Profile</h3></div>
        <div className="set-rows">
          <div className="set-row"><span className="app-muted">Name</span><strong>{user?.name || '—'}</strong></div>
          <div className="set-row"><span className="app-muted">Email</span><strong>{user?.email || '—'}</strong></div>
          <div className="set-row"><span className="app-muted">Plan</span><span className="app-pill neutral">Free</span></div>
        </div>
      </section>

      <section className="app-card set-section">
        <div className="set-section-head"><Cpu size={17} /><h3>Protection service</h3></div>
        {loading ? <Spinner /> : (
          <div className="set-rows">
            <div className="set-row">
              <span className="app-muted">ProofMark Standard</span>
              <span className={`app-pill ${standardOk ? 'success' : 'danger'}`}>{standardOk ? 'Available' : 'Offline'}</span>
            </div>
            <div className="set-row">
              <span className="app-muted">ProofMark Advanced</span>
              <span className={`app-pill ${strongOk ? 'success' : 'neutral'}`}>{strongOk ? 'Available' : 'Not enabled'}</span>
            </div>
            <div className="set-row">
              <span className="app-muted">Protection service</span>
              <span className={`app-pill ${engineConnected ? 'success' : 'danger'}`}>
                {engineConnected ? 'Connected' : 'Unreachable'}
              </span>
            </div>
          </div>
        )}
      </section>

      <section className="app-card set-section">
        <div className="set-section-head"><Lock size={17} /><h3>Storage &amp; privacy</h3></div>
        <p className="app-muted set-note">
          Originals are stored privately and used only to prove ownership. Watermarked copies
          are what you publish. Evidence reports are generated on demand.
        </p>
      </section>

      <section className="app-card set-section">
        <div className="set-section-head"><ShieldCheck size={17} /><h3>Account &amp; security</h3></div>
        <div className="set-rows">
          <div className="set-row">
            <span className="app-muted">Sign out of this device</span>
            <button className="app-ghost-btn" onClick={() => { logout(); navigate('/login'); }}>
              <LogOut size={15} /><span>Log out</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
