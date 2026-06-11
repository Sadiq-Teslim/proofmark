import { useEffect, useState } from 'react';
import api from '../api.js';

export default function Recipients() {
  const [recipients, setRecipients] = useState([]);
  const [form, setForm] = useState({ name: '', email: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const load = async () => {
    const { data } = await api.get('/recipients');
    setRecipients(data.recipients);
  };
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      await api.post('/recipients', form);
      setForm({ name: '', email: '' });
      await load();
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Failed to add recipient');
    } finally { setBusy(false); }
  };

  return (
    <>
      <h1>Recipients</h1>
      <div className="card">
        <h2>Add a recipient</h2>
        <form onSubmit={add}>
          <label>Name</label>
          <input value={form.name} onChange={set('name')} required />
          <label>Email (optional)</label>
          <input type="email" value={form.email} onChange={set('email')} />
          {err && <div className="err">{err}</div>}
          <button disabled={busy}>{busy ? 'Adding…' : 'Add recipient'}</button>
        </form>
      </div>

      <div className="card">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Added</th></tr></thead>
          <tbody>
            {recipients.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td className="muted">{r.email || '—'}</td>
                <td className="muted">{new Date(r.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {recipients.length === 0 && <p className="muted">No recipients yet.</p>}
      </div>
    </>
  );
}
