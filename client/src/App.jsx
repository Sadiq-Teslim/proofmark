import { Navigate, Route, Routes } from 'react-router-dom';
import Protected from './components/Protected.jsx';
import Assets from './pages/Assets.jsx';
import Issuances from './pages/Issuances.jsx';
import Issue from './pages/Issue.jsx';
import Login from './pages/Login.jsx';
import Recipients from './pages/Recipients.jsx';
import Register from './pages/Register.jsx';
import Trace from './pages/Trace.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Protected><Assets /></Protected>} />
      <Route path="/recipients" element={<Protected><Recipients /></Protected>} />
      <Route path="/issue" element={<Protected><Issue /></Protected>} />
      <Route path="/issuances" element={<Protected><Issuances /></Protected>} />
      <Route path="/trace" element={<Protected><Trace /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
