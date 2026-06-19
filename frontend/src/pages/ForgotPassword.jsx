import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Mail, AlertCircle, Loader, CheckCircle, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send reset link. Please check your email.');
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
        maxWidth: '420px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        padding: '36px 24px'
      }}>
        {/* Back Link */}
        <Link to="/login" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text-muted)',
          textDecoration: 'none',
          fontSize: '0.85rem',
          fontWeight: 500,
          alignSelf: 'flex-start'
        }}>
          <ArrowLeft size={16} />
          <span>Back to Login</span>
        </Link>

        {/* Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '2.5rem' }}>🔒</span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Reset Password</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Enter your email and we'll send you a recovery link</p>
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
              <strong style={{ display: 'block', marginBottom: '2px' }}>Check your inbox!</strong>
              <span>A password reset link has been dispatched to {email}. Follow the email instructions.</span>
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
                'Send Reset Link'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
