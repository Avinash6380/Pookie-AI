import React, { useState, useEffect } from 'react';
import { useCharacter } from '../context/CharacterContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiCall } from '../services/api.js';
import { Heart, Star, Award, ShieldAlert, Zap, Loader } from 'lucide-react';

const Relationship = () => {
  const { getAuthHeaders } = useAuth();
  const { activeCharacter, activeRelationship, preferences } = useCharacter();
  
  const [stats, setStats] = useState({ chatCount: 0, streakCount: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await apiCall('/api/profile', 'GET', null, getAuthHeaders);
        setStats({
          chatCount: data.chatCount,
          streakCount: data.streakCount
        });
      } catch (err) {
        console.error('Fetch stats error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [getAuthHeaders]);

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

  const getTierStatus = (tierLevel) => {
    const currentLvl = activeRelationship.level || 1;
    if (currentLvl === tierLevel) {
      return 'Current Status';
    }
    return currentLvl > tierLevel ? 'Completed' : 'Locked';
  };

  // Define details for each level
  const levelsInfo = [
    {
      level: 1,
      name: 'Stranger',
      rangeText: '0 - 99 XP',
      unlocks: ['Basic introductions', 'Polite replies', 'Standard companion avatar'],
      status: getTierStatus(1)
    },
    {
      level: 2,
      name: 'Friend',
      rangeText: '100 - 299 XP',
      unlocks: ['Casual friendly banter', 'Daily streak trackers', 'Emoji reactions to replies'],
      status: getTierStatus(2)
    },
    {
      level: 3,
      name: 'Close Friend',
      rangeText: '300 - 599 XP',
      unlocks: ['Deep emotional listening', 'Speech recognition mic inputs', 'Personal memories database storage'],
      status: getTierStatus(3)
    },
    {
      level: 4,
      name: 'Partner',
      rangeText: '600 - 999 XP',
      unlocks: ['Affectionate Tanglish romance', 'SpeechSynthesis voice outputs', 'Custom context menus triggers'],
      status: getTierStatus(4)
    },
    {
      level: 5,
      name: 'Soulmate',
      rangeText: '1000+ XP',
      unlocks: ['Unconditional deep bonding dialogues', 'Milestone celebration confetti overlays', 'Ultimate relationship tier status'],
      status: getTierStatus(5)
    }
  ];

  // Visual XP progress inside current level
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
    <div style={{ paddingBottom: '40px', maxWidth: '900px', margin: '0 auto' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Heart size={28} style={{ color: 'var(--primary)' }} />
          <span>Relationship Progression Hub</span>
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Review level-up boundaries and track your evolving emotional connection with your active partner.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Core Stats overview */}
        {activeCharacter && (
          <div className="glass-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', border: '1px solid var(--card-border)' }}>
            {/* Left Col: Companion Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '240px' }}>
              <span style={{ fontSize: '3.5rem' }}>{activeCharacter.avatar}</span>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontFamily: 'Outfit, sans-serif' }}>{getCompanionName()}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>{activeCharacter.personality} Companion</p>
                <span style={{
                  fontSize: '0.75rem',
                  background: 'var(--primary-glow)',
                  border: '1px solid var(--primary)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  display: 'inline-block',
                  marginTop: '6px',
                  fontWeight: 600
                }}>
                  LVL {activeRelationship.level} - {activeRelationship.levelName}
                </span>
              </div>
            </div>

            {/* Right Col: Progress Meter */}
            <div style={{ flexGrow: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ fontWeight: 600 }}>XP PROGRESS</span>
                <span style={{ color: 'var(--text-muted)' }}>{currentXp} Total XP</span>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{
                  width: `${percent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--primary), var(--secondary))'
                }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>{stats.chatCount} total interactions</span>
                <span>
                  {labelText}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tiers Progression List */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Relationship Milestones</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {levelsInfo.map((tier) => {
              const isCurrent = activeRelationship.level === tier.level;
              const isCompleted = activeRelationship.level > tier.level;
              
              let statusColor = 'var(--text-muted)';
              let statusBg = 'rgba(255,255,255,0.03)';
              let borderStyle = '1px solid var(--card-border)';
              
              if (isCurrent) {
                statusColor = 'var(--primary)';
                statusBg = 'var(--primary-glow)';
                borderStyle = '2px solid var(--primary)';
              } else if (isCompleted) {
                statusColor = '#10b981';
                statusBg = 'rgba(16, 185, 129, 0.08)';
                borderStyle = '1px solid rgba(16, 185, 129, 0.2)';
              }

              return (
                <div 
                  key={tier.level}
                  className={`glass-card ${isCurrent ? 'level-up-flash' : ''}`}
                  style={{
                    padding: '16px 20px',
                    border: borderStyle,
                    background: statusBg,
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '16px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: isCurrent ? 'var(--primary)' : 'var(--text-main)' }}>
                        Level {tier.level}: {tier.name}
                      </h4>
                      <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>({tier.rangeText})</span>
                    </div>

                    {/* Unlocks List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>UNLOCKED DIALOGUES & SYSTEMS:</span>
                      {tier.unlocks.map((unl, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: isCompleted || isCurrent ? 'var(--text-main)' : 'var(--text-muted)' }}>
                          <Zap size={10} style={{ color: isCurrent || isCompleted ? 'var(--primary)' : 'var(--text-muted)' }} />
                          <span>{unl}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status Tag */}
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: statusColor,
                    padding: '4px 10px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '8px',
                    border: `1px solid ${statusColor}`
                  }}>
                    {isCurrent ? 'Current Status' : isCompleted ? 'Completed' : 'Locked'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Relationship;
