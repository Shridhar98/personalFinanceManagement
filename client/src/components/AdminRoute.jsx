import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { dbUser, loading } = useAuth();
  if (loading) return null;
  return dbUser?.isAdmin ? children : <Navigate to="/dashboard" replace />;
}
