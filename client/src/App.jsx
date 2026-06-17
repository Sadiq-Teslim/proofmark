import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import SeoMeta from './components/SeoMeta.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Overview from './pages/app/Overview.jsx';
import Protect from './pages/app/Protect.jsx';
import Verify from './pages/app/Verify.jsx';
import Tracking from './pages/app/Tracking.jsx';
import Properties from './pages/app/Properties.jsx';
import PropertyDetail from './pages/app/PropertyDetail.jsx';
import Evidence from './pages/app/Evidence.jsx';
import Settings from './pages/app/Settings.jsx';

function RequireAuth({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <SeoMeta />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/app" element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route index element={<Overview />} />
          <Route path="protect" element={<Protect />} />
          <Route path="verify" element={<Verify />} />
          <Route path="tracking" element={<Tracking />} />
          <Route path="properties" element={<Properties />} />
          <Route path="properties/:id" element={<PropertyDetail />} />
          <Route path="evidence" element={<Evidence />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
