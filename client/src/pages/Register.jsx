import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../auth.jsx';
import Logo from '../components/Logo.jsx';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data.token, data.user);
      navigate('/app');
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-brand-panel">
        <Link to="/" aria-label="ProofMark home"><Logo tone="light" /></Link>
        <div>
          <span className="auth-kicker">Start with one image</span>
          <h1>Create a traceable version before you share.</h1>
          <p>Protect your first image, verify suspicious copies, and build a record of where your property appears.</p>
        </div>
        <div className="auth-proof-card">
          <span>Ready in minutes</span>
          <strong>Upload. Protect. Verify.</strong>
          <small>Standard and Strong watermark modes</small>
        </div>
      </section>

      <section className="auth-form-panel">
        <form className="auth-form" onSubmit={submit}>
          <div className="auth-mobile-logo"><Logo /></div>
          <span className="auth-kicker">Create account</span>
          <h2>Protect your first image.</h2>
          <p>Set up your ProofMark workspace and start testing the full protection flow.</p>

          <label htmlFor="name">Name</label>
          <input id="name" value={form.name} onChange={set('name')} required />
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={form.email} onChange={set('email')} required />
          <label htmlFor="password">Password</label>
          <input id="password" type="password" minLength={8} value={form.password} onChange={set('password')} required />
          {err && <div className="err">{err}</div>}
          <button className="auth-submit" disabled={busy}>{busy ? 'Creating account...' : 'Create account'}</button>
          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
