import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const onLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="nav">
      <span className="brand">ProofMark</span>
      <NavLink to="/">Assets</NavLink>
      <NavLink to="/recipients">Recipients</NavLink>
      <NavLink to="/issue">Issue</NavLink>
      <NavLink to="/issuances">Issued</NavLink>
      <NavLink to="/trace">Trace</NavLink>
      <span className="muted" style={{ marginLeft: 'auto' }}>{user?.name}</span>
      <button className="btn-ghost" onClick={onLogout}>Log out</button>
    </nav>
  );
}
