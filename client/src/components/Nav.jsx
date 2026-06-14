import { NavLink, useNavigate } from 'react-router-dom';
import { BadgeCheck, GalleryVerticalEnd, Images, LogOut } from 'lucide-react';
import { useAuth } from '../auth.jsx';
import Logo from './Logo.jsx';

export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const onLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="nav">
      <NavLink to="/app" className="brand" aria-label="ProofMark app">
        <Logo lockup={false} size="sm" />
        <span>ProofMark</span>
      </NavLink>
      <div className="nav-links">
        <NavLink to="/app">
          <Images size={18} />
          <span>Protect</span>
        </NavLink>
        <NavLink to="/verify">
          <BadgeCheck size={18} />
          <span>Verify</span>
        </NavLink>
        <a href="/app#properties">
          <GalleryVerticalEnd size={18} />
          <span>Properties</span>
        </a>
      </div>
      <div className="nav-user">
        <span>{user?.name}</span>
        <button className="icon-button" onClick={onLogout} aria-label="Log out" title="Log out">
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
}
