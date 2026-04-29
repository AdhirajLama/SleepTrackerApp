import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Renders children only when a JWT exists. Re-checks localStorage on each render
 * so navigation after login is not blocked by a stale parent render.
 */
function RequireAuth({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

export default RequireAuth;
