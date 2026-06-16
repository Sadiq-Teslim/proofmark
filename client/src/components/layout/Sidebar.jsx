import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
import Logo from '../Logo.jsx';
import { useAuth } from '../../auth.jsx';
import { navItems } from './navItems.js';

const initialsOf = (name) =>
  (name || 'User')
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`app-sidebar ${open ? 'is-open' : ''}`}>
      <div className="app-sidebar-head">
        <NavLink to="/app" className="app-sidebar-brand" onClick={onClose}>
          <Logo tone="light" size="sm" />
        </NavLink>
        <button className="app-icon-btn app-drawer-close" onClick={onClose} aria-label="Close menu">
          <X size={20} />
        </button>
      </div>

      <nav className="app-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) => `app-nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="app-sidebar-foot">
        <div className="app-usercard">
          <span className="app-avatar">{initialsOf(user?.name)}</span>
          <div className="app-usercard-meta">
            <strong>{user?.name || 'Your account'}</strong>
            <span>{user?.email}</span>
          </div>
        </div>
        <div className="app-foot-row">
          <span className="app-plan-badge">Free plan</span>
          <button className="app-logout" onClick={onLogout}>
            <LogOut size={15} />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
