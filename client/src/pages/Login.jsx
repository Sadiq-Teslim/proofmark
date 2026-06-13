import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../auth.jsx';
import Logo from '../components/Logo.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token, data.user);
      navigate('/app');
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Login failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="center">
      <form className="card auth-card" onSubmit={submit}>
        <Logo />
        <h1>Welcome back</h1>
        <p className="muted">Sign in to watermark and trace your images.</p>
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {err && <div className="err">{err}</div>}
        <button disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <p className="muted" style={{ marginTop: 14 }}>
          No account? <Link to="/register">Create one</Link>
        </p>
      </form>
    </div>
  );
}
