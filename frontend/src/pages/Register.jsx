import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Lock, Mail, User, AlertCircle, Loader, CheckCircle } from 'lucide-react';

const Register = () => {
  const { user, signUp, signInWithGoogle, signInWithFacebook } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect logged-in users to dashboard automatically
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await signUp(email, password, username);
      setSuccess(true);
      setTimeout(() => {
        // Redirect to login page after successful registration
        navigate('/login');
      }, 4000);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google login error:', err);
      setError(err.message || 'Failed to initialize Google login. Please check your Firebase configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithFacebook();
    } catch (err) {
      console.error('Facebook login error:', err);
      setError(err.message || 'Failed to initialize Facebook login. Please check your Supabase OAuth configuration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--bg-gradient)'
    }} className="animate-fade-in">
      <div className="glass-card" style={{
        maxWidth: '440px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        padding: '36px 24px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '2.5rem' }}>💕</span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Create Account</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Start your journey with your AI Companion</p>
        </div>

        {/* Success Alert */}
        {success && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            color: '#10b981',
            padding: '16px',
            borderRadius: 'var(--border-radius-sm)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            fontSize: '0.85rem'
          }}>
            <CheckCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '2px' }}>Registration Successful!</strong>
              <span>Your account is ready. Redirecting you to login...</span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && !success && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            padding: '12px',
            borderRadius: 'var(--border-radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Username */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Username</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="CompanionLover"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', paddingLeft: '40px' }}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  placeholder="yourname@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', paddingLeft: '40px' }}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', paddingLeft: '40px' }}
                  required
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', paddingLeft: '40px' }}
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="glass-button glass-button-primary"
              style={{ width: '100%', padding: '12px', marginTop: '8px' }}
              disabled={loading}
            >
              {loading ? (
                <Loader size={18} className="animate-spin" style={{ animation: 'bounce 1s infinite' }} />
              ) : (
                'Sign Up'
              )}
            </button>
          </form>
        )}

        {!success && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0', gap: '10px' }}>
              <div style={{ flexGrow: 1, height: '1px', background: 'var(--card-border)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>or register with</span>
              <div style={{ flexGrow: 1, height: '1px', background: 'var(--card-border)' }} />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                type="button" 
                className="glass-button" 
                style={{ 
                  flexGrow: 1, 
                  padding: '10px 16px', 
                  fontSize: '0.85rem', 
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  border: '1px solid var(--card-border)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  color: 'var(--text-main)',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--primary-glow)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 0 12px var(--primary-glow)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.borderColor = 'var(--card-border)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  e.currentTarget.style.color = 'var(--text-main)';
                }}
                onClick={handleGoogleLogin}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>Google</span>
              </button>
              <button 
                type="button" 
                className="glass-button" 
                style={{ 
                  flexGrow: 1, 
                  padding: '10px 16px', 
                  fontSize: '0.85rem', 
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  border: '1px solid var(--card-border)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  color: 'var(--text-main)',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--primary-glow)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 0 12px var(--primary-glow)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.borderColor = 'var(--card-border)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  e.currentTarget.style.color = 'var(--text-main)';
                }}
                onClick={handleFacebookLogin}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
                </svg>
                <span>Facebook</span>
              </button>
            </div>
          </>
        )}

        {/* Footer link */}
        {!success && (
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Log In</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Register;
