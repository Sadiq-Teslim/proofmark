import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import api from '../api.js';
import { useAuth } from '../auth.jsx';
import Logo from '../components/Logo.jsx';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const fieldErrors = useMemo(() => ({
    email: email && !emailPattern.test(email) ? 'Please enter a valid email address.' : '',
    password: password && password.length < 8 ? 'Password must be at least 8 characters.' : '',
  }), [email, password]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setErr('');
    if (!emailPattern.test(email) || password.length < 8) return;
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

  const showEmailError = submitted && (!email || fieldErrors.email);
  const showPasswordError = submitted && (!password || fieldErrors.password);

  return (
    <main className="signin-shell">
      <section className="signin-form-panel">
        <Link to="/" className="signin-logo" aria-label="ProofMark home">
          <Logo tone="light" />
        </Link>

        <form className="signin-form" onSubmit={submit}>
          <h1>Welcome back.</h1>
          <p>Sign in to manage your protected images.</p>

          <label htmlFor="email">Email</label>
          <div className={`signin-input ${showEmailError ? 'invalid' : ''}`}>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={showEmailError ? 'true' : 'false'}
              required
            />
            {showEmailError && <AlertCircle size={22} />}
          </div>
          {showEmailError && (
            <span className="signin-field-error">
              {fieldErrors.email || 'Please enter a valid email address.'}
            </span>
          )}

          <div className="signin-label-row">
            <label htmlFor="password">Password</label>
            <button type="button">Forgot password?</button>
          </div>
          <div className={`signin-input ${showPasswordError ? 'invalid' : ''}`}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={showPasswordError ? 'true' : 'false'}
              required
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? <Eye size={23} /> : <EyeOff size={23} />}
            </button>
          </div>
          {showPasswordError && (
            <span className="signin-field-error">
              {fieldErrors.password || 'Password must be at least 8 characters.'}
            </span>
          )}
          {err && <div className="signin-server-error">{err}</div>}

          <button className="signin-submit" disabled={busy}>
            {busy && <Loader2 className="spin" size={22} />}
            <span>Sign in</span>
          </button>

          <p className="signin-switch">
            New to ProofMark? <Link to="/register">Create an account</Link>
          </p>
        </form>
      </section>

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
    </main>
  );
}
