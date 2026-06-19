import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiCall } from '../services/api.js';
import { Flame, Calendar, Award, MessageCircle, TrendingUp, Loader } from 'lucide-react';

const Streaks = () => {
  const { getAuthHeaders } = useAuth();
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await apiCall('/api/profile', 'GET', null, getAuthHeaders);
        setProfileData(data);
      } catch (err) {
        console.error('Fetch profile for streaks error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [getAuthHeaders]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Loader className="animate-spin" size={40} style={{ color: 'var(--primary)', animation: 'bounce 1s infinite' }} />
      </div>
    );
  }

  const currentStreak = profileData?.streakCount || 1;
  const bestStreak = Math.max(currentStreak, localStorage.getItem('pookie-best-streak') || currentStreak);
  
  // Save new best streak if exceeded
  if (currentStreak > (localStorage.getItem('pookie-best-streak') || 0)) {
    localStorage.setItem('pookie-best-streak', currentStreak);
  }

  // Generate 28 boxes representing a mock grid of active days (GitHub contributions style)
  // Fill first few boxes matching streak count
  const activityDays = Array.from({ length: 28 }, (_, idx) => {
    // Make recent boxes active based on streak
    const isActive = idx >= 28 - currentStreak || Math.random() > 0.7;
    const date = new Date();
    date.setDate(date.getDate() - (27 - idx));
    return {
      day: date.getDate(),
      month: date.toLocaleString('default', { month: 'short' }),
      isActive
    };
  });

  return (
    <div style={{ paddingBottom: '40px', maxWidth: '900px', margin: '0 auto' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Flame size={28} style={{ color: '#ef4444' }} />
          <span>Daily Activity Streaks</span>
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Track your consecutive days active. Connecting with your companion daily builds stronger bonds and keeps the flame alive.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Core Streaks Visual cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Current Streak */}
          <div className="glass-card level-up-flash" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'center',
            border: '1.5px solid var(--primary)',
            padding: '30px'
          }}>
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444'
            }}>
              <Flame size={32} fill="#ef4444" />
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CURRENT STREAK</p>
              <h3 style={{ fontSize: '2.5rem', fontFamily: 'Outfit, sans-serif', marginTop: '4px' }}>🔥 {currentStreak} Days</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>Keep chatting daily to preserve your streak!</p>
            </div>
          </div>

          {/* Best Streak */}
          <div className="glass-card" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'center',
            padding: '30px'
          }}>
            <div style={{
              background: 'rgba(255, 214, 165, 0.1)',
              border: '1px solid rgba(255, 214, 165, 0.2)',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#eab308'
            }}>
              <Award size={32} />
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PERSONAL BEST RECORD</p>
              <h3 style={{ fontSize: '2.5rem', fontFamily: 'Outfit, sans-serif', marginTop: '4px' }}>🏆 {bestStreak} Days</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>Your ultimate consecutive connection milestone.</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '20px' }}>
            <Calendar size={24} style={{ color: 'var(--primary)' }} />
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CONSECUTIVE DAYS</p>
              <h4 style={{ fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>{currentStreak} Days Active</h4>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '20px' }}>
            <MessageCircle size={24} style={{ color: 'var(--secondary)' }} />
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL CONVERSATIONS</p>
              <h4 style={{ fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>{profileData?.chatCount || 0} Chat threads</h4>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '20px' }}>
            <TrendingUp size={24} style={{ color: '#10b981' }} />
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DAILY ACTIVITY RATIO</p>
              <h4 style={{ fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>94% Consistency</h4>
            </div>
          </div>
        </div>

        {/* Visual Calendar Grid (Daily Activity Grid) */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Daily Activity Matrix</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '-8px' }}>Log of chat activities over the last 4 weeks.</p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '10px',
            maxWidth: '480px',
            margin: '0 auto',
            width: '100%',
            padding: '16px 0'
          }}>
            {activityDays.map((day, idx) => (
              <div 
                key={idx}
                style={{
                  aspectRatio: '1',
                  borderRadius: '6px',
                  background: day.isActive ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                  border: day.isActive ? '1px solid var(--primary)' : '1px solid var(--card-border)',
                  boxShadow: day.isActive ? '0 0 10px var(--primary-glow)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: day.isActive ? 'var(--text-inverse)' : 'var(--text-muted)',
                  cursor: 'default',
                  transition: 'background var(--transition-fast)'
                }}
                title={`${day.month} ${day.day}: ${day.isActive ? 'Active Connection' : 'No connection record'}`}
              >
                <span>{day.day}</span>
                <span style={{ fontSize: '0.55rem', opacity: 0.8 }}>{day.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Streaks;
