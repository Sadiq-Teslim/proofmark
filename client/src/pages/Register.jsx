import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../auth.jsx';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data.token, data.user);
      navigate('/');
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Registration failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="center">
      <form className="card auth-card" onSubmit={submit}>
        <h1>Create account</h1>
        <label>Name</label>
        <input value={form.name} onChange={set('name')} required />
        <label>Email</label>
        <input type="email" value={form.email} onChange={set('email')} required />
        <label>Password (min 8)</label>
        <input type="password" value={form.password} onChange={set('password')} required />
        {err && <div className="err">{err}</div>}
        <button disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        <p className="muted" style={{ marginTop: 14 }}>
          Have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
