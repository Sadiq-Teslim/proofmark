import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu, Plus, Search } from 'lucide-react';
import Logo from '../Logo.jsx';
import { useAuth } from '../../auth.jsx';

const initialsOf = (name) =>
  (name || 'User').split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

export default function Topbar({ title, onMenu }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(`/app/properties${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`);
  };

  return (
    <header className="app-topbar">
      <button className="app-icon-btn app-menu-btn" onClick={onMenu} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <div className="app-topbar-title">
        <span className="app-mobile-logo"><Logo size="sm" lockup={false} /></span>
        <h1>{title}</h1>
      </div>

      <form className="app-search" onSubmit={submitSearch}>
        <Search size={16} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search properties, payloads, sightings…"
          aria-label="Search"
        />
      </form>

      <button className="app-primary-btn app-topbar-cta" onClick={() => navigate('/app/protect')}>
        <Plus size={16} />
        <span>Protect image</span>
      </button>

      <button className="app-icon-btn app-bell" aria-label="Activity">
        <Bell size={18} />
      </button>

      <div className="app-account" ref={menuRef}>
        <button className="app-account-btn" onClick={() => setMenuOpen((o) => !o)} aria-label="Account">
          <span className="app-avatar sm">{initialsOf(user?.name)}</span>
          <ChevronDown size={15} />
        </button>
        {menuOpen && (
          <div className="app-account-menu">
            <div className="app-account-head">
              <strong>{user?.name || 'Your account'}</strong>
              <span>{user?.email}</span>
            </div>
            <button onClick={() => navigate('/app/settings')}>Settings</button>
            <button onClick={() => { logout(); navigate('/login'); }}>
              <LogOut size={15} /> Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
