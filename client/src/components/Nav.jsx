import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const onLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="nav">
      <span className="brand">ProofMark</span>
      <NavLink to="/">My Images</NavLink>
      <NavLink to="/verify">Verify</NavLink>
      <span className="muted" style={{ marginLeft: 'auto' }}>{user?.name}</span>
      <button className="btn-ghost" onClick={onLogout}>Log out</button>
    </nav>
  );
}
