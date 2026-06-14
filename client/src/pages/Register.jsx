import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Fingerprint, Loader2, ShieldCheck, UserRound } from 'lucide-react';
import api from '../api.js';
import { useAuth } from '../auth.jsx';
import GoogleIcon from '../components/GoogleIcon.jsx';
import Logo from '../components/Logo.jsx';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    <main className="pm-auth is-signup">
      <div className="pm-aurora" aria-hidden="true">
        <span className="pm-blob pm-blob-1" />
        <span className="pm-blob pm-blob-2" />
        <span className="pm-grid" />
      </div>

      <div className="pm-auth-shell">
        <section className="pm-auth-form-side">
          <Link to="/" className="pm-auth-logo" aria-label="ProofMark home">
            <Logo tone="light" size="sm" />
          </Link>

          <div className="pm-auth-head">
            <h1>Create your <span className="pm-grad">account.</span></h1>
            <p>Start protecting your images in minutes.</p>
          </div>

          <form className="pm-auth-form" onSubmit={submit}>
            <div className="pm-field">
              <label htmlFor="name">Full name</label>
              <div className={`pm-input ${showNameError ? 'invalid' : ''}`}>
                <input
                  id="name"
                  placeholder="Jane Photographer"
                  value={form.name}
                  onChange={set('name')}
                  aria-invalid={showNameError ? 'true' : 'false'}
                  required
                />
                {showNameError
                  ? <AlertCircle size={18} />
                  : <UserRound className="pm-neutral" size={18} />}
              </div>
              {showNameError && <span className="pm-field-error">Please enter your full name.</span>}
            </div>

            <div className="pm-field">
              <label htmlFor="email">Email</label>
              <div className={`pm-input ${showEmailError ? 'invalid' : ''}`}>
                <input
                  id="email"
                  type="email"
                  placeholder="jane@example.com"
                  value={form.email}
                  onChange={set('email')}
                  aria-invalid={showEmailError ? 'true' : 'false'}
                  required
                />
                {showEmailError && <AlertCircle size={18} />}
              </div>
              {showEmailError && <span className="pm-field-error">Please enter a valid email address.</span>}
            </div>

            <div className="pm-field">
              <label htmlFor="password">Password</label>
              <div className={`pm-input ${showPasswordError ? 'invalid' : ''}`}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
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
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
              {form.password && (
                <div className="pm-strength" data-score={passwordScore}>
                  <div>
                    {[0, 1, 2, 3].map((item) => (
                      <span key={item} className={passwordScore > item ? 'active' : ''} />
                    ))}
                  </div>
                  <strong>{passwordLabel}</strong>
                </div>
              )}
              {showPasswordError && (
                <span className="pm-field-error">Password must be at least 8 characters.</span>
              )}
            </div>

            <p className="pm-privacy">
              <ShieldCheck size={16} /> Your originals stay private — we only store what&apos;s
              needed to prove ownership.
            </p>
            {err && <div className="pm-server-error">{err}</div>}

            <button className="pm-auth-submit" disabled={busy}>
              {busy ? <Loader2 className="spin" size={18} /> : <ShieldCheck size={18} />}
              <span>Create account</span>
            </button>

            <div className="pm-auth-divider"><span>or</span></div>

            <button className="pm-auth-google" type="button">
              <GoogleIcon />
              <strong>Continue with Google</strong>
            </button>
          </form>

          <p className="pm-auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
          <p className="pm-terms">
            By continuing you agree to our <a href="/terms">Terms</a> &amp; <a href="/privacy">Privacy</a>.
          </p>
        </section>

        <aside className="pm-auth-brand-side" aria-hidden="true">
          <div className="pm-auth-glow" />
          <div className="pm-auth-brand-inner">
            <span className="pm-auth-fp"><Fingerprint size={38} /></span>
            <Logo tone="light" lockup={false} size="lg" />
            <h2>Trace your images.<br /><span className="pm-grad">Prove they&apos;re yours.</span></h2>
            <code>payload #4F2A9C</code>
          </div>
        </aside>
      </div>
    </main>
  );
}
