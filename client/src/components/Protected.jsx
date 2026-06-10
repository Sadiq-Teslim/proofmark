import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import Nav from './Nav.jsx';

export default function Protected({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return (
    <>
      <Nav />
      <div className="container">{children}</div>
    </>
  );
}
