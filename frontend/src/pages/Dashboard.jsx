import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCharacter } from '../context/CharacterContext.jsx';
import { apiCall } from '../services/api.js';
import { Flame, MessageSquare, Plus, Trash2, Heart, Award, Sparkles, Brain, Loader } from 'lucide-react';

const Dashboard = () => {
  const { getAuthHeaders } = useAuth();
  const { activeCharacter, activeRelationship, preferences } = useCharacter();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [memories, setMemories] = useState([]);
  const [newFact, setNewFact] = useState('');
  const [newImportance, setNewImportance] = useState(1);
  const [loading, setLoading] = useState(true);
  const [memoryLoading, setMemoryLoading] = useState(false);

  // Fetch dashboard stats & memories
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [profile, facts] = await Promise.all([
          apiCall('/api/profile', 'GET', null, getAuthHeaders),
          apiCall('/api/memories', 'GET', null, getAuthHeaders)
        ]);

        setProfileData(profile);
        setMemories(facts);
      } catch (err) {
        console.error('Fetch dashboard stats error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [getAuthHeaders]);

  const handleAddFact = async (e) => {
    e.preventDefault();
    if (!newFact.trim()) return;

    setMemoryLoading(true);
    try {
      const addedMemory = await apiCall('/api/memories', 'POST', {
        fact: newFact,
        importance: newImportance
      }, getAuthHeaders);

      setMemories([addedMemory, ...memories]);
      setNewFact('');
      setNewImportance(1);
    } catch (err) {
      console.error('Add memory fact error:', err);
    } finally {
      setMemoryLoading(false);
    }
  };

  const handleDeleteFact = async (id) => {
    try {
      await apiCall(`/api/memories/${id}`, 'DELETE', null, getAuthHeaders);
      setMemories(memories.filter(m => m.id !== id));
    } catch (err) {
      console.error('Delete memory fact error:', err);
    }
  };

  const getCompanionName = () => {
    if (!activeCharacter) return 'Companion';
    if (activeCharacter.id === 'pookie' && preferences?.assistant_name) {
      return preferences.assistant_name;
    }
    return activeCharacter.name;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Loader className="animate-spin" size={40} style={{ color: 'var(--primary)', animation: 'bounce 1s infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '40px' }} className="animate-fade-in">
      {/* Welcome Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div>
          <h2 style={{ fontSize: '2.2rem', marginBottom: '6px' }}>Hello, {profileData?.username || 'user'}! ✨</h2>
          <p style={{ color: 'var(--text-muted)' }}>Welcome back to your companion workspace.</p>
        </div>
        <button
          onClick={() => navigate('/chat')}
          className="glass-button glass-button-primary"
          style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <MessageSquare size={18} />
          <span>Chat Now</span>
        </button>
      </div>

      {/* Main Stats Widgets */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {/* Streak card */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '12px',
            borderRadius: '12px',
            color: '#ef4444'
          }}>
            <Flame size={28} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>DAILY STREAK</p>
            <h3 style={{ fontSize: '1.6rem', fontFamily: 'Outfit, sans-serif' }}>🔥 {profileData?.streakCount || 1} Days</h3>
          </div>
        </div>

        {/* Total conversations */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            padding: '12px',
            borderRadius: '12px',
            color: 'var(--primary)'
          }}>
            <MessageSquare size={28} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>TOTAL CHATS</p>
            <h3 style={{ fontSize: '1.6rem', fontFamily: 'Outfit, sans-serif' }}>💬 {profileData?.chatCount || 0} Messages</h3>
          </div>
        </div>

        {/* Current Partner info */}
        {activeCharacter && (
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '2.5rem', display: 'block' }}>
              {activeCharacter.avatar}
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ACTIVE COMPANION</p>
              <h3 style={{ fontSize: '1.3rem', fontFamily: 'Outfit, sans-serif' }}>{getCompanionName()}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>{activeCharacter.personality}</p>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Relationship Details & Memory Systems */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '24px'
      }}>
        {/* Relationship Meter */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Heart size={18} style={{ color: 'var(--secondary)' }} />
            <span>Relationship Progress</span>
          </h3>

          {activeCharacter && (() => {
            const currentXp = activeRelationship.xp || 0;
            const currentLvl = activeRelationship.level || 1;
            
            let percent = 0;
            let labelText = '';
            
            if (currentLvl === 1) {
              percent = Math.min(100, (currentXp / 100) * 100);
              labelText = `${100 - currentXp} XP to Friend (Level 2)`;
            } else if (currentLvl === 2) {
              percent = Math.min(100, ((currentXp - 100) / 200) * 100);
              labelText = `${300 - currentXp} XP to Close Friend (Level 3)`;
            } else if (currentLvl === 3) {
              percent = Math.min(100, ((currentXp - 300) / 300) * 100);
              labelText = `${600 - currentXp} XP to Partner (Level 4)`;
            } else if (currentLvl === 4) {
              percent = Math.min(100, ((currentXp - 600) / 400) * 100);
              labelText = `${1000 - currentXp} XP to Soulmate (Level 5)`;
            } else {
              percent = 100;
              labelText = 'Max tier reached! You are Soulmates 💖';
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 600 }}>Level {activeRelationship.level} - {activeRelationship.levelName}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{currentXp} XP</span>
                </div>

                {/* Progress Meter */}
                <div>
                  <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${percent}%`, 
                      height: '100%', 
                      background: 'linear-gradient(90deg, var(--primary), var(--secondary))' 
                    }} />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    {labelText}
                  </p>
                </div>

                {/* Relationship Tiers list */}
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Relationship Progression Tiers:</h4>
                  {[
                    { lvl: 1, name: 'Stranger', range: '0 - 99 XP' },
                    { lvl: 2, name: 'Friend', range: '100 - 299 XP' },
                    { lvl: 3, name: 'Close Friend', range: '300 - 599 XP' },
                    { lvl: 4, name: 'Partner', range: '600 - 999 XP' },
                    { lvl: 5, name: 'Soulmate', range: '1000+ XP' }
                  ].map(tier => {
                    const current = activeRelationship.level === tier.lvl;
                    return (
                      <div 
                        key={tier.lvl}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 12px',
                          background: current ? 'var(--primary-glow)' : 'rgba(255,255,255,0.01)',
                          border: current ? '1px solid var(--primary)' : '1px solid transparent',
                          borderRadius: '8px',
                          fontSize: '0.8rem'
                        }}
                      >
                        <span style={{ fontWeight: current ? 600 : 400 }}>Level {tier.lvl}: {tier.name}</span>
                        <span style={{ color: current ? 'var(--text-main)' : 'var(--text-muted)' }}>{tier.range}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Memory facts manager */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Brain size={18} style={{ color: '#10b981' }} />
            <span>Companion Memories</span>
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '-8px' }}>
            Add facts about your favorite foods, music, or goals. Your companion references these in conversation!
          </p>

          {/* Form to add fact */}
          <form onSubmit={handleAddFact} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="E.g., I love deep house music"
                value={newFact}
                onChange={(e) => setNewFact(e.target.value)}
                className="glass-input"
                style={{ flexGrow: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                required
              />
              <button
                type="submit"
                className="glass-button glass-button-primary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                disabled={memoryLoading}
              >
                {memoryLoading ? '...' : <Plus size={16} />}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Importance Factor:</label>
              <select
                value={newImportance}
                onChange={(e) => setNewImportance(parseInt(e.target.value, 10))}
                className="glass-input"
                style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'var(--input-bg)' }}
              >
                <option value="1">1 - Low (Minor detail)</option>
                <option value="3">3 - Medium (Regular reference)</option>
                <option value="5">5 - High (Core details)</option>
              </select>
            </div>
          </form>

          {/* List of facts */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '260px',
            overflowY: 'auto',
            marginTop: '10px'
          }}>
            {memories.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '24px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                No memories saved yet. Type a fact above to get started!
              </p>
            ) : (
              memories.map(mem => (
                <div 
                  key={mem.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    gap: '12px'
                  }}
                >
                  <div style={{ flexGrow: 1 }}>
                    <p style={{ color: 'var(--text-main)' }}>{mem.fact}</p>
                    <span style={{ fontSize: '0.7rem', color: '#10b981' }}>Importance: {mem.importance}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteFact(mem.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }}
                    className="delete-fact-btn"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
