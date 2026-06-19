import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiCall } from '../services/api.js';
import { User, Mail, Calendar, MessageSquare, Flame, Edit2, Loader, Save } from 'lucide-react';

const Profile = () => {
  const { getAuthHeaders } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  // Preselected Dicebear seeds for avatars
  const AVATAR_SEEDS = ['Felix', 'Sasha', 'Milo', 'Bella', 'Oliver', 'Lucy', 'Jasper', 'Chloe'];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await apiCall('/api/profile', 'GET', null, getAuthHeaders);
        setProfile(data);
        setEditUsername(data.username);
        setEditAvatar(data.avatar);
      } catch (err) {
        console.error('Fetch profile stats error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [getAuthHeaders]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!editUsername.trim()) return;

    setUpdateLoading(true);
    try {
      const updatedUser = await apiCall('/api/profile', 'PUT', {
        username: editUsername,
        avatar: editAvatar
      }, getAuthHeaders);

      setProfile(prev => ({
        ...prev,
        username: updatedUser.username,
        avatar: updatedUser.avatar
      }));
      setIsEditing(false);
    } catch (err) {
      console.error('Update profile stats error:', err);
    } finally {
      setUpdateLoading(false);
    }
  };

  const getJoinedDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Loader className="animate-spin" size={40} style={{ color: 'var(--primary)', animation: 'bounce 1s infinite' }} />
      </div>
    );
  }

  // Pre-seed names map for characters
  const CHARACTER_NAMES = {
    pookie: 'Pookie',
    sakura: 'Sakura',
    luna: 'Luna',
    mia: 'Mia',
    ava: 'Ava'
  };

  const CHARACTER_AVATARS = {
    pookie: '💕',
    sakura: '🌸',
    luna: '🌙',
    mia: '🦋',
    ava: '✨'
  };

  const RELATIONSHIP_LEVELS = {
    'L0': 'Stranger',
    'L1': 'Friend',
    'L2': 'Close Friend',
    'L3': 'Best Friend',
    'L4': 'Partner',
    'L5': 'Soulmate',
    1: 'Stranger',
    2: 'Friend',
    3: 'Close Friend',
    4: 'Partner',
    5: 'Soulmate'
  };

  return (
    <div style={{ paddingBottom: '40px', maxWidth: '1000px', margin: '0 auto' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>My Companion Profile</h2>
        <p style={{ color: 'var(--text-muted)' }}>Manage your user details, inspect streak metrics, and review relationship progressions.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        {/* Profile Card & Info update */}
        <div className="glass-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
          {/* Avatar Column */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '2px solid var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img 
                src={editAvatar} 
                alt="Profile Avatar" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix';
                }}
              />
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="glass-button"
                style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Edit2 size={12} />
                <span>Edit Profile</span>
              </button>
            )}
          </div>

          {/* Info Details / Edit Form */}
          <div style={{ flexGrow: 1, minWidth: '280px' }}>
            {!isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '1.6rem', fontFamily: 'Outfit, sans-serif' }}>{profile?.username}</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                    <Mail size={16} />
                    <span>{profile?.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                    <Calendar size={16} />
                    <span>Registered: {getJoinedDate(profile?.createdAt)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Edit Username */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Username</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="glass-input"
                    style={{ maxWidth: '300px' }}
                    required
                  />
                </div>

                {/* Edit Avatar Selector */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Choose Profile Avatar Seed</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {AVATAR_SEEDS.map(seed => {
                      const url = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
                      const isSelected = editAvatar === url;
                      
                      return (
                        <button
                          key={seed}
                          type="button"
                          onClick={() => setEditAvatar(url)}
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            border: isSelected ? '2.5px solid var(--primary)' : '1px solid var(--card-border)',
                            background: isSelected ? 'var(--primary-glow)' : 'rgba(255,255,255,0.03)',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          <img src={url} alt={seed} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="submit"
                    className="glass-button glass-button-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                    disabled={updateLoading}
                  >
                    <Save size={14} />
                    <span>{updateLoading ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditUsername(profile.username);
                      setEditAvatar(profile.avatar);
                    }}
                    className="glass-button"
                    style={{ fontSize: '0.85rem' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Aggregate Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
            <Flame size={20} style={{ color: '#ef4444' }} />
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Daily Streak</p>
              <h4 style={{ fontSize: '1.2rem', fontFamily: 'Outfit, sans-serif' }}>{profile?.streakCount} Days</h4>
            </div>
          </div>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
            <MessageSquare size={20} style={{ color: 'var(--primary)' }} />
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Messages Sent</p>
              <h4 style={{ fontSize: '1.2rem', fontFamily: 'Outfit, sans-serif' }}>{profile?.chatCount} Chat msgs</h4>
            </div>
          </div>
        </div>

        {/* Relationships Progression Table */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.25rem' }}>Active Companion Relationships</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '-8px' }}>Your level standing with all seeded companion personas.</p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '450px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <th style={{ padding: '12px 8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Companion</th>
                  <th style={{ padding: '12px 8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Relationship Level</th>
                  <th style={{ padding: '12px 8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>XP Progress</th>
                </tr>
              </thead>
              <tbody>
                {['pookie', 'sakura', 'luna', 'mia', 'ava'].map(charId => {
                  const rels = profile?.relationships || [];
                  const rel = rels.find(r => r.character_id === charId) || { level: 1, xp: 0 };
                  const name = CHARACTER_NAMES[charId];
                  const avatar = CHARACTER_AVATARS[charId];
                  const lvlName = RELATIONSHIP_LEVELS[rel.level] || 'Stranger';
                  
                  const currentXp = rel.xp || 0;
                  const currentLevel = rel.level || 1;
                  let percent = 0;
                  if (currentLevel === 1) {
                    percent = Math.min(100, (currentXp / 100) * 100);
                  } else if (currentLevel === 2) {
                    percent = Math.min(100, ((currentXp - 100) / 200) * 100);
                  } else if (currentLevel === 3) {
                    percent = Math.min(100, ((currentXp - 300) / 300) * 100);
                  } else if (currentLevel === 4) {
                    percent = Math.min(100, ((currentXp - 600) / 400) * 100);
                  } else {
                    percent = 100;
                  }
                  
                  return (
                    <tr key={charId} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      {/* Name */}
                      <td style={{ padding: '16px 8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.8rem' }}>{avatar}</span>
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.9rem' }}>{name}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {charId}</span>
                        </div>
                      </td>
                      
                      {/* Level */}
                      <td style={{ padding: '16px 8px', fontSize: '0.9rem' }}>
                        <span style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid var(--card-border)',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          color: 'var(--primary)',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}>
                          LVL {rel.level} - {lvlName}
                        </span>
                      </td>

                      {/* XP Progress Bar */}
                      <td style={{ padding: '16px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '150px' }}>
                          <div style={{ flexGrow: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${percent}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, var(--primary), var(--secondary))'
                            }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{currentXp} XP</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
