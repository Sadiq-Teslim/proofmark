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
    setErr('');
    setBusy(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token, data.user);
      navigate('/app');
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-brand-panel">
        <Link to="/" aria-label="ProofMark home"><Logo tone="light" /></Link>
        <div>
          <span className="auth-kicker">Traceable image property</span>
          <h1>Welcome back to your protected image workspace.</h1>
          <p>Verify suspicious copies, track appearances, and keep evidence tied to your original work.</p>
        </div>
        <div className="auth-proof-card">
          <span>Match confirmed</span>
          <strong>chalk-proofmark.png</strong>
          <small>Payload #2 / Standard / Evidence ready</small>
        </div>
      </section>

      <section className="auth-form-panel">
        <form className="auth-form" onSubmit={submit}>
          <div className="auth-mobile-logo"><Logo /></div>
          <span className="auth-kicker">Sign in</span>
          <h2>Continue protecting your images.</h2>
          <p>Use the account connected to your protected ProofMark property.</p>

          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {err && <div className="err">{err}</div>}
          <button className="auth-submit" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
          <p className="auth-switch">
            New to ProofMark? <Link to="/register">Create an account</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
