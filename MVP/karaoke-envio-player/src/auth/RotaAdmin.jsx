import { Navigate } from 'react-router-dom';
import { useSessaoAdmin } from './sessaoAdmin';

export function RotaAdmin({ children }) {
  const sessao = useSessaoAdmin();
  if (!sessao) return <Navigate to="/admin/login" replace />;
  return children;
}
