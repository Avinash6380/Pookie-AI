import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase.js';
import { Loader, AlertCircle } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Wait for Supabase to resolve the session from hash/code in the URL
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
          navigate('/dashboard');
        } else {
          // Listen to state changes if not resolved immediately
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
              subscription.unsubscribe();
              navigate('/dashboard');
            }
          });
          
          // Timeout after 6 seconds
          const timeout = setTimeout(() => {
            subscription.unsubscribe();
            setError("Authentication session resolution timed out. Please try logging in again.");
          }, 6000);
          
          return () => clearTimeout(timeout);
        }
      } catch (err) {
        console.error('OAuth callback processing error:', err);
        setError(err.message || 'Failed to complete OAuth callback session exchange.');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--bg-gradient)'
    }}>
      <div className="glass-card" style={{
        maxWidth: '380px',
        width: '100%',
        padding: '36px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        {error ? (
          <>
            <div style={{ color: '#ef4444' }}>
              <AlertCircle size={48} />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Authentication Failed</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{error}</p>
            <button 
              onClick={() => navigate('/login')}
              className="glass-button glass-button-primary"
              style={{ width: '100%', padding: '10px' }}
            >
              Back to Login
            </button>
          </>
        ) : (
          <>
            <span style={{ fontSize: '2.5rem' }}>🔐</span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Securing Session</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Completing your secure login to Pookie AI...</p>
            <Loader size={36} className="animate-spin" style={{ color: 'var(--primary)', marginTop: '8px' }} />
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
