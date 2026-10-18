import { Navigate } from 'react-router-dom';
import { getUser, homeFor } from '../services/session';

// Sends visitors without the right role back to where they belong (login if signed out)
const RequireRole = ({ role, children }) => {
  const user = getUser();
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />;
  return children;
};

export default RequireRole;
