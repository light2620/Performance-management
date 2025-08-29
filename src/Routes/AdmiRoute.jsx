// routes/AdminRoute.jsx
import React from 'react';
import { useAuth } from '../Utils/AuthContext';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const { user, isLoggedIn, loadingUser } = useAuth();

  if (loadingUser) {
    // show nothing or a spinner/placeholder
    return null; // or <div className="spinner" />
  }

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
