import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--bg-gradient)'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid var(--card-border)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'bounce 1s infinite'
        }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
