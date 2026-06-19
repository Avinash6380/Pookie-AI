import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { CharacterProvider } from './context/CharacterContext.jsx';
import './index.css';
import { isConfigured } from './services/supabase.js';

const SetupOverlay = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'linear-gradient(135deg, #121212 0%, #1a1a1a 100%)',
      color: '#ffffff',
      textAlign: 'center',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div className="glass-card" style={{
        maxWidth: '500px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        padding: '40px 30px',
        border: '1.5px solid var(--primary, #FF4F81)',
        boxShadow: '0 0 30px rgba(255, 79, 129, 0.2)'
      }}>
        <span style={{ fontSize: '3rem' }}>💕</span>
        <h2 style={{ fontSize: '1.8rem', fontFamily: 'Outfit, sans-serif' }}>Pookie AI Setup Required</h2>
        <p style={{ fontSize: '0.95rem', color: '#a6a3bf', lineHeight: '1.5' }}>
          You need to configure your Supabase environment variables before launching the application.
        </p>
        
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255, 79, 129, 0.2)',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'left',
          width: '100%',
          fontSize: '0.85rem',
          fontFamily: 'monospace',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div>1. Create a <strong>.env</strong> file in <strong>frontend/</strong></div>
          <div>2. Populate it with your Supabase credentials:</div>
          <div style={{ 
            color: '#FF4F81', 
            background: '#000000', 
            padding: '10px 14px', 
            borderRadius: '4px', 
            marginTop: '4px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}>
            VITE_SUPABASE_URL=https://your-supabase-project.supabase.co{"\n"}
            VITE_SUPABASE_ANON_KEY=your-anon-public-key{"\n"}
            VITE_API_URL=http://localhost:5000
          </div>
        </div>
        
        <p style={{ fontSize: '0.8rem', color: '#a6a3bf' }}>
          Check your walkthrough document for full setup and deployment details.
        </p>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isConfigured ? (
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <CharacterProvider>
              <App />
            </CharacterProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    ) : (
      <SetupOverlay />
    )}
  </React.StrictMode>
);
