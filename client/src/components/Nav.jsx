import { NavLink, useNavigate } from 'react-router-dom';
import { BadgeCheck, Images, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth.jsx';

export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const onLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="nav">
      <NavLink to="/" className="brand" aria-label="ProofMark home">
        <span className="brand-mark"><ShieldCheck size={18} /></span>
        <span>ProofMark</span>
      </NavLink>
      <div className="nav-links">
        <NavLink to="/">
          <Images size={18} />
          <span>Property</span>
        </NavLink>
        <NavLink to="/verify">
          <BadgeCheck size={18} />
          <span>Verify</span>
        </NavLink>
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
