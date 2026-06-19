import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCharacter } from '../context/CharacterContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { apiCall } from '../services/api.js';
import { Settings as SettingsIcon, Save, RefreshCw, Volume2, Mic, Eye, Check, User } from 'lucide-react';

const Settings = () => {
  const { getAuthHeaders } = useAuth();
  const { preferences, updatePreferences } = useCharacter();
  const { theme, setTheme } = useTheme();

  // Onboarding Profile State
  const [userName, setUserName] = useState('');

  // Form States
  const [assistantName, setAssistantName] = useState('Pookie');
  const [personality, setPersonality] = useState('Romantic');
  
  // Voice preferences
  const [voiceInput, setVoiceInput] = useState(false);
  const [voiceOutput, setVoiceOutput] = useState(false); // Auto read responses
  const [readAloudAvailable, setReadAloudAvailable] = useState(true);
  const [voices, setVoices] = useState([]);
  const [voiceType, setVoiceType] = useState('');
  
  // Speech synthesis metrics
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [speechVolume, setSpeechVolume] = useState(1.0);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch initial configs on mount
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const data = await apiCall('/api/profile', 'GET', null, getAuthHeaders);
        if (data.userName) {
          setUserName(data.userName);
        }
      } catch (err) {
        console.warn('Could not load profile name:', err.message);
      }
    };
    fetchProfileData();

    // Pull local vocal parameters
    setVoiceInput(localStorage.getItem('pookie-voice-input') === 'true');
    setVoiceOutput(localStorage.getItem('pookie-voice-output') === 'true');
    setVoiceType(localStorage.getItem('pookie-voice-type') || '');
    
    const readAvail = localStorage.getItem('pookie-read-aloud-available');
    setReadAloudAvailable(readAvail === null ? true : readAvail === 'true');

    setSpeechRate(parseFloat(localStorage.getItem('pookie-speech-rate') || '1.0'));
    setSpeechPitch(parseFloat(localStorage.getItem('pookie-speech-pitch') || '1.0'));
    setSpeechVolume(parseFloat(localStorage.getItem('pookie-speech-volume') || '1.0'));
  }, [getAuthHeaders]);

  useEffect(() => {
    if (preferences) {
      setAssistantName(preferences.assistant_name || 'Pookie');
      setPersonality(preferences.personality || 'Romantic');
    }
  }, [preferences]);

  // Load SpeechSynthesis voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadAvailableVoices = () => {
        const list = window.speechSynthesis.getVoices();
        setVoices(list.filter(v => v.lang.startsWith('en')));
      };
      loadAvailableVoices();
      window.speechSynthesis.onvoiceschanged = loadAvailableVoices;
    }
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaveSuccess(false);

    try {
      // 1. Save preferences on backend (name, personality, theme)
      await updatePreferences({
        assistant_name: assistantName,
        personality,
        theme
      });

      // 2. Save User Name to backend user_memory and sync AI memories
      if (userName.trim()) {
        await apiCall('/api/profile/name', 'POST', { name: userName.trim() }, getAuthHeaders);
      }

      // 3. Save voice settings locally
      localStorage.setItem('pookie-voice-input', voiceInput);
      localStorage.setItem('pookie-voice-output', voiceOutput);
      localStorage.setItem('pookie-voice-type', voiceType);
      localStorage.setItem('pookie-read-aloud-available', readAloudAvailable);
      localStorage.setItem('pookie-speech-rate', speechRate);
      localStorage.setItem('pookie-speech-pitch', speechPitch);
      localStorage.setItem('pookie-speech-volume', speechVolume);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Save settings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  const restoreDefaults = () => {
    setAssistantName('Pookie');
    setPersonality('Romantic');
  };

  const personalityTypes = [
    'Romantic',
    'Friendly',
    'Supportive',
    'Flirty',
    'Caring',
    'Intelligent',
    'Playful',
    'Gamer'
  ];

  return (
    <div style={{ paddingBottom: '40px', maxWidth: '800px', margin: '0 auto' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SettingsIcon size={28} />
          <span>App Settings</span>
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>Configure your identity, UI styling, and companion options.</p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Profile Settings (User Name) */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} />
            <span>Profile Settings</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Your Name</label>
            <input
              type="text"
              placeholder="What should I call you?"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="glass-input"
              required
            />
          </div>
        </div>

        {/* Companion Customization */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🤖 Companion Customization</span>
            <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px', color: 'var(--text-muted)' }}>Applies to "Pookie" Character</span>
          </h3>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {/* Name */}
            <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Assistant Custom Name</label>
              <input
                type="text"
                placeholder="Pookie"
                value={assistantName}
                onChange={(e) => setAssistantName(e.target.value)}
                className="glass-input"
                required
              />
            </div>

            {/* Personality */}
            <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Personality Type</label>
              <select
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                className="glass-input"
                style={{ background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--card-border)' }}
              >
                {personalityTypes.map(p => (
                  <option key={p} value={p} style={{ background: '#1c1926', color: 'white' }}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              type="button"
              onClick={restoreDefaults}
              className="glass-button"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <RefreshCw size={14} />
              <span>Reset Pookie Defaults</span>
            </button>
          </div>
        </div>

        {/* UI Themes Selection */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={18} />
            <span>Theme Preference</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
            {[
              { id: 'dark', name: 'Dark Theme', color: '#130f22', text: 'Default' },
              { id: 'light', name: 'Light Theme', color: '#f3e8ff', text: 'Bright' },
              { id: 'pink', name: 'Pink Theme', color: '#3d0b21', text: 'Rosy Glow' },
              { id: 'purple', name: 'Purple Theme', color: '#1f1448', text: 'Lavender' }
            ].map(t => {
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleThemeChange(t.id)}
                  style={{
                    background: t.color,
                    border: active ? '2.5px solid var(--primary)' : '1px solid var(--card-border)',
                    borderRadius: 'var(--border-radius-md)',
                    padding: '16px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    position: 'relative'
                  }}
                >
                  {active && (
                    <div style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      background: 'var(--primary)',
                      borderRadius: '50%',
                      padding: '2px',
                      color: 'var(--text-inverse)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: t.id === 'light' ? '#2d1a22' : '#ffffff' }}>{t.name}</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.7, color: t.id === 'light' ? '#7c6a72' : '#a6a3bf' }}>{t.text}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Voice and Speech Settings */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Volume2 size={18} />
            <span>Voice & Audio Settings</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Mic Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Mic size={20} style={{ color: 'var(--primary)' }} />
                <div>
                  <h4 style={{ fontSize: '0.95rem' }}>Enable Voice Input (🎤 Speak)</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Access Speech Recognition features in the chat box</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={voiceInput}
                onChange={(e) => setVoiceInput(e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>

            {/* Read Aloud Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Volume2 size={20} style={{ color: 'var(--secondary)' }} />
                <div>
                  <h4 style={{ fontSize: '0.95rem' }}>Enable Read Aloud Feature</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Show manual "Read Aloud" options on right-click/long-press menus</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={readAloudAvailable}
                onChange={(e) => setReadAloudAvailable(e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>

            {/* Auto Read Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Volume2 size={20} style={{ color: 'var(--primary)' }} />
                <div>
                  <h4 style={{ fontSize: '0.95rem' }}>Enable Auto-Read Responses</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Automatically read aloud companion replies via Text-to-Speech (Default: OFF)</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={voiceOutput}
                onChange={(e) => setVoiceOutput(e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>

            {/* Voice Type selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Vocal Accent / Accent Tone</label>
              <select
                value={voiceType}
                onChange={(e) => setVoiceType(e.target.value)}
                className="glass-input"
                style={{ background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--card-border)', width: '100%' }}
              >
                <option value="">Default System Language Voice</option>
                {voices.map(v => (
                  <option key={v.name} value={v.name} style={{ background: '#1c1926', color: 'white' }}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            {/* Sliders for Volume, Pitch, Rate */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
              {/* Volume */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Speech Volume</span>
                  <span style={{ fontWeight: 600 }}>{Math.round(speechVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={speechVolume}
                  onChange={(e) => setSpeechVolume(parseFloat(e.target.value))}
                  style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>

              {/* Pitch */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Pitch</span>
                  <span style={{ fontWeight: 600 }}>{speechPitch.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={speechPitch}
                  onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                  style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>

              {/* Speech Rate */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Speech Rate (Speed)</span>
                  <span style={{ fontWeight: 600 }}>{speechRate.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Submit Save */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {saveSuccess ? (
            <span style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: 600 }}>Preferences Saved Successfully!</span>
          ) : (
            <span />
          )}

          <button
            type="submit"
            className="glass-button glass-button-primary"
            style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
            disabled={loading}
          >
            <Save size={18} />
            <span>{loading ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
