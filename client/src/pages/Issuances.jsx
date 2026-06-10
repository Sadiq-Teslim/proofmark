import { useEffect, useState } from 'react';
import api from '../api.js';

export default function Issuances() {
  const [issuances, setIssuances] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await api.get('/issuances');
      setIssuances(data.issuances);
    })();
  }, []);

  return (
    <>
      <h1>Issued copies</h1>
      <div className="card">
        <table>
          <thead>
            <tr><th>Asset</th><th>Recipient</th><th>Payload</th><th>Engine</th><th>Date</th><th /></tr>
          </thead>
          <tbody>
            {issuances.map((i) => (
              <tr key={i._id}>
                <td>{i.asset?.title || '—'}</td>
                <td>{i.recipient?.name || '—'}</td>
                <td><span className="tag">#{i.payload}</span></td>
                <td className="muted">{i.engine}</td>
                <td className="muted">{new Date(i.createdAt).toLocaleDateString()}</td>
                <td><a href={i.watermarkedUrl} target="_blank" rel="noreferrer">download</a></td>
              </tr>
            ))}
          </tbody>
        </table>
        {issuances.length === 0 && <p className="muted">Nothing issued yet.</p>}
      </div>
    </>
  );
}
