import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { Menu, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from './context/AuthContext.jsx';
import { apiCall } from './services/api.js';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Sidebar from './components/Sidebar.jsx';

// Pages
import LandingPage from './pages/LandingPage.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Chat from './pages/Chat.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import Characters from './pages/Characters.jsx';
import Memory from './pages/Memory.jsx';
import Relationship from './pages/Relationship.jsx';
import Streaks from './pages/Streaks.jsx';
import AuthCallback from './pages/AuthCallback.jsx';


const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Mobile Sticky Glass Header */}
      <div className="mobile-navbar-glass">
        <button 
          onClick={() => setSidebarOpen(true)}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-main)', 
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <Menu size={24} />
        </button>
        <span style={{ 
          marginLeft: '12px', 
          fontSize: '1.2rem', 
          fontFamily: 'Outfit, sans-serif', 
          fontWeight: 600,
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Pookie AI
        </span>
      </div>

      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
      
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="main-content">
        {children}
      </main>

      {/* Sleek mobile bottom navigation */}
      <div className="mobile-bottom-nav">
        <NavLink to="/chat" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <span className="bottom-nav-icon">💬</span>
          <span className="bottom-nav-label">Chat</span>
        </NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <span className="bottom-nav-icon">🕘</span>
          <span className="bottom-nav-label">History</span>
        </NavLink>
        <NavLink to="/characters" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <span className="bottom-nav-icon">💕</span>
          <span className="bottom-nav-label">Characters</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <span className="bottom-nav-icon">👤</span>
          <span className="bottom-nav-label">Profile</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <span className="bottom-nav-icon">⚙️</span>
          <span className="bottom-nav-label">Settings</span>
        </NavLink>
      </div>
    </div>
  );
};

function App() {
  const { user, getAuthHeaders } = useAuth();
  
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1); // 1 = Name, 2 = Gender
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check onboarding status when session changes
  useEffect(() => {
    if (!user) {
      setShowOnboarding(false);
      setOnboardingStep(1);
      setNameInput('');
      return;
    }

    const checkOnboarding = async () => {
      try {
        const data = await apiCall('/api/profile/onboarding', 'GET', null, getAuthHeaders);
        if (data && !data.onboarded) {
          setShowOnboarding(true);
        }
      } catch (err) {
        console.warn('Could not determine onboarding status:', err);
      }
    };

    checkOnboarding();
  }, [user]);

  const handleGenderSelect = async (selectedGender) => {
    if (!nameInput.trim()) {
      setOnboardingStep(1);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiCall('/api/profile/onboarding', 'POST', {
        name: nameInput.trim(),
        gender: selectedGender
      }, getAuthHeaders);

      setShowOnboarding(false);
    } catch (err) {
      console.error('Failed to submit onboarding:', err);
      setError(err.message || 'Failed to save onboarding preferences.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showOnboarding && (
        <div className="onboarding-overlay">
          <div className="glass-card onboarding-card animate-scale-in">
            {onboardingStep === 1 ? (
              <>
                <span style={{ fontSize: '3rem' }}>💖</span>
                <h2 style={{ fontSize: '1.8rem', fontFamily: 'Outfit, sans-serif' }}>Welcome to Pookie AI 💖</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>What should I call you?</p>
                
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', textAlign: 'center', fontSize: '1.1rem', marginTop: '8px' }}
                  required
                />

                <button
                  onClick={() => nameInput.trim() && setOnboardingStep(2)}
                  className="glass-button glass-button-primary"
                  style={{ width: '100%', padding: '14px', marginTop: '12px' }}
                  disabled={!nameInput.trim()}
                >
                  Continue
                </button>
              </>
            ) : (
              <>
                <span style={{ fontSize: '3rem' }}>💕</span>
                <h2 style={{ fontSize: '1.8rem', fontFamily: 'Outfit, sans-serif' }}>Tell me a little about yourself 💕</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Choose your gender identity</p>

                {error && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    padding: '10px',
                    borderRadius: 'var(--border-radius-sm)',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <AlertCircle size={14} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="gender-grid">
                  <button
                    onClick={() => handleGenderSelect('male')}
                    className="gender-button"
                    disabled={loading}
                  >
                    <img src="/male.png" alt="Male" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Male</span>
                  </button>

                  <button
                    onClick={() => handleGenderSelect('female')}
                    className="gender-button"
                    disabled={loading}
                  >
                    <img src="/female.png" alt="Female" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Female</span>
                  </button>

                  <button
                    onClick={() => handleGenderSelect('trans')}
                    className="gender-button"
                    disabled={loading}
                  >
                    <img src="/trans.png" alt="Trans" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Trans</span>
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                  <button
                    onClick={() => setOnboardingStep(1)}
                    className="glass-button"
                    style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                    disabled={loading}
                  >
                    Back
                  </button>
                  {loading && (
                    <Loader className="animate-spin" size={16} style={{ color: 'var(--primary)' }} />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Authenticated Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Layout><Chat /></Layout></ProtectedRoute>} />
        <Route path="/characters" element={<ProtectedRoute><Layout><Characters /></Layout></ProtectedRoute>} />
        <Route path="/memory" element={<ProtectedRoute><Layout><Memory /></Layout></ProtectedRoute>} />
        <Route path="/relationship" element={<ProtectedRoute><Layout><Relationship /></Layout></ProtectedRoute>} />
        <Route path="/streaks" element={<ProtectedRoute><Layout><Streaks /></Layout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />

        {/* Catch all redirect to Landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
