import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Loader2, ShieldCheck, UserRound } from 'lucide-react';
import api from '../api.js';
import { useAuth } from '../auth.jsx';
import Logo from '../components/Logo.jsx';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AuthArt() {
  return (
    <section className="signin-art-panel" aria-hidden="true">
      <div className="signin-dot-field top" />
      <div className="signin-dot-field bottom" />
      <code className="signin-code top-left">payload #4F2A9C</code>
      <code className="signin-code top-right">id: 4F2A9C<br />sig: 8C7D1E2A9B3F</code>
      <code className="signin-code bottom-left">id: 4F2A9C<br />sig: 8C7D1E2A9B3F</code>
      <code className="signin-code bottom-right">payload #4F2A9C</code>
      <div className="signin-orbit">
        <div className="signin-badge">
          <Logo tone="light" lockup={false} size="lg" />
        </div>
      </div>
      <h2>Trace your images.<br /><span>Prove they&apos;re yours.</span></h2>
    </section>
  );
}

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const passwordScore = useMemo(() => {
    let score = 0;
    if (form.password.length >= 8) score += 1;
    if (form.password.length >= 12) score += 1;
    if (/[A-Z]/.test(form.password) && /[a-z]/.test(form.password)) score += 1;
    if (/\d/.test(form.password) || /[^A-Za-z0-9]/.test(form.password)) score += 1;
    return Math.min(score, 4);
  }, [form.password]);

  const passwordLabel = passwordScore >= 3 ? 'Strong' : passwordScore >= 2 ? 'Good' : 'Weak';
  const passwordMessage = passwordScore >= 3
    ? 'Great! This password is strong.'
    : 'Use at least 8 characters with mixed letters and numbers.';
  const showNameError = submitted && !form.name.trim();
  const showEmailError = submitted && !emailPattern.test(form.email);
  const showPasswordError = submitted && form.password.length < 8;

  const submit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setErr('');
    if (!form.name.trim() || !emailPattern.test(form.email) || form.password.length < 8) return;
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
    <main className="signin-shell signup-shell">
      <section className="signin-form-panel signup-form-panel">
        <Link to="/" className="signin-logo" aria-label="ProofMark home">
          <Logo tone="light" />
        </Link>

        <form className="signin-form signup-form" onSubmit={submit}>
          <h1>Create your account.</h1>
          <p>Start protecting your images in minutes.</p>

          <label htmlFor="name">Full name</label>
          <div className={`signin-input ${showNameError ? 'invalid' : ''}`}>
            <input
              id="name"
              placeholder="Jane Photographer"
              value={form.name}
              onChange={set('name')}
              aria-invalid={showNameError ? 'true' : 'false'}
              required
            />
            {showNameError ? <AlertCircle size={22} /> : <UserRound className="signin-neutral-icon" size={22} />}
          </div>
          {showNameError && <span className="signin-field-error">Please enter your full name.</span>}

          <label htmlFor="email">Email</label>
          <div className={`signin-input ${showEmailError ? 'invalid' : ''}`}>
            <input
              id="email"
              type="email"
              placeholder="jane@example.com"
              value={form.email}
              onChange={set('email')}
              aria-invalid={showEmailError ? 'true' : 'false'}
              required
            />
            {showEmailError && <AlertCircle size={22} />}
          </div>
          {showEmailError && <span className="signin-field-error">Please enter a valid email address.</span>}

          <label htmlFor="password">Password</label>
          <div className={`signin-input ${showPasswordError ? 'invalid' : form.password ? 'valid' : ''}`}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              aria-invalid={showPasswordError ? 'true' : 'false'}
              required
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? <EyeOff size={23} /> : <Eye size={23} />}
            </button>
          </div>

          <div className="signup-strength" data-score={passwordScore}>
            <div>
              {[0, 1, 2, 3].map((item) => (
                <span key={item} className={passwordScore > item ? 'active' : ''} />
              ))}
            </div>
            <strong>{passwordLabel}</strong>
          </div>
          <span className={`signin-field-error signup-password-note ${showPasswordError ? 'danger' : ''}`}>
            {showPasswordError ? 'Password must be at least 8 characters.' : passwordMessage}
          </span>

          <p className="signup-privacy"><ShieldCheck size={20} /> Your originals stay private. We only store what&apos;s needed to prove ownership.</p>
          {err && <div className="signin-server-error">{err}</div>}

          <button className="signin-submit signup-submit" disabled={busy}>
            {busy && <Loader2 className="spin" size={22} />}
            <span>Create account</span>
          </button>

          <p className="signin-switch signup-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
          <p className="signup-terms">
            By continuing you agree to our <a href="/terms">Terms</a> &amp; <a href="/privacy">Privacy</a>.
          </p>
        </form>
      </section>

      <AuthArt />
    </main>
  );
}
