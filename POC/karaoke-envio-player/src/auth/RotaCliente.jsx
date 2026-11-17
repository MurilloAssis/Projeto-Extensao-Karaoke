import { Navigate } from 'react-router-dom';
import { useSessaoCliente } from './sessaoCliente';

export function RotaCliente({ children }) {
  const sessao = useSessaoCliente();
  if (!sessao) return <Navigate to="/cliente" replace />;
  return children;
}
