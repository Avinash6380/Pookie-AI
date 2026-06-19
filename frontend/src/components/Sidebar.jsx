import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCharacter } from '../context/CharacterContext.jsx';
import { 
  Home, 
  PlusCircle, 
  MessageSquare, 
  Users, 
  Brain, 
  Heart, 
  Flame, 
  User, 
  Settings as SettingsIcon, 
  LogOut,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { signOut } = useAuth();
  const { characters, activeCharacter, setActiveCharacter, activeRelationship, preferences } = useCharacter();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleNewChat = () => {
    // Select default 'pookie' and navigate to chat
    const pookie = characters.find(c => c.id === 'pookie') || characters[0];
    if (pookie) {
      setActiveCharacter(pookie);
    }
    navigate('/chat');
    if (window.innerWidth <= 768) toggleSidebar();
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <Home size={18} /> },
    { name: 'Characters', path: '/characters', icon: <Users size={18} /> },
    { name: 'AI Memory', path: '/memory', icon: <Brain size={18} /> },
    { name: 'Relationships', path: '/relationship', icon: <Heart size={18} /> },
    { name: 'Daily Streaks', path: '/streaks', icon: <Flame size={18} /> },
    { name: 'My Profile', path: '/profile', icon: <User size={18} /> },
    { name: 'Settings', path: '/settings', icon: <SettingsIcon size={18} /> },
  ];

  // Grouped Chat History (Mocking realistic conversation instances)
  const historyGroups = [
    {
      title: "Today's Chats",
      items: [
        { charId: 'pookie', name: 'Pookie', avatar: '💕', preview: 'Can we go on a date today?...' },
      ]
    },
    {
      title: "Yesterday",
      items: [
        { charId: 'sakura', name: 'Sakura', avatar: '🌸', preview: 'Haha, that gaming clip was...' },
      ]
    },
    {
      title: "Previous Conversations",
      items: [
        { charId: 'luna', name: 'Luna', avatar: '🌙', preview: 'I was thinking about gravity...' },
        { charId: 'mia', name: 'Mia', avatar: '🦋', preview: 'I am always here to listen...' }
      ]
    }
  ];

  const handleHistoryItemClick = (charId) => {
    const char = characters.find(c => c.id === charId);
    if (char) {
      setActiveCharacter(char);
    }
    navigate('/chat');
    if (window.innerWidth <= 768) toggleSidebar();
  };

  const getCompanionName = () => {
    if (!activeCharacter) return 'Companion';
    if (activeCharacter.id === 'pookie' && preferences?.assistant_name) {
      return preferences.assistant_name;
    }
    return activeCharacter.name;
  };

  const getSidebarProgress = () => {
    const currentXp = activeRelationship.xp || 0;
    const currentLvl = activeRelationship.level || 1;
    
    if (currentLvl === 1) {
      return Math.min(100, (currentXp / 100) * 100);
    } else if (currentLvl === 2) {
      return Math.min(100, ((currentXp - 100) / 200) * 100);
    } else if (currentLvl === 3) {
      return Math.min(100, ((currentXp - 300) / 300) * 100);
    } else if (currentLvl === 4) {
      return Math.min(100, ((currentXp - 600) / 400) * 100);
    } else {
      return 100;
    }
  };

  return (
    <aside className={`sidebar glass-panel ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.6rem' }}>💕</span>
          <h1 style={{ 
            fontSize: '1.3rem', 
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            fontFamily: 'Outfit, sans-serif'
          }}>
            Pookie AI
          </h1>
        </div>
        <button 
          onClick={toggleSidebar} 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-main)', 
            cursor: 'pointer',
          }}
          className="mobile-only-btn"
        >
          <X size={20} className="mobile-close-icon" />
        </button>
      </div>

      {/* Chat Now Button */}
      <button
        onClick={handleNewChat}
        className="glass-button glass-button-primary"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '10px',
          marginBottom: '20px',
          borderRadius: 'var(--border-radius-sm)',
        }}
      >
        <MessageSquare size={18} />
        <span>Chat Now</span>
      </button>

      {/* Nav Menu */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '20px' }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={() => {
              if (window.innerWidth <= 768) toggleSidebar();
            }}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: 'var(--border-radius-sm)',
              color: isActive ? 'var(--text-inverse)' : 'var(--text-muted)',
              background: isActive ? 'var(--primary)' : 'transparent',
              textDecoration: 'none',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '0.9rem',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            })}
            className="nav-link-item"
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Grouped Chat History Section */}
      <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {historyGroups.map((group) => (
          <div key={group.title} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, paddingLeft: '8px' }}>
              {group.title}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {group.items.map((item) => {
                const isSelected = activeCharacter?.id === item.charId && window.location.pathname === '/chat';
                
                return (
                  <div
                    key={item.charId}
                    onClick={() => handleHistoryItemClick(item.charId)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px',
                      borderRadius: 'var(--border-radius-sm)',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(255, 79, 129, 0.08)' : 'transparent',
                      border: isSelected ? '1px solid var(--primary-glow)' : '1px solid transparent',
                      transition: 'background var(--transition-fast)'
                    }}
                    className="history-item-hover"
                  >
                    <span style={{ fontSize: '1.4rem' }}>{item.avatar}</span>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexGrow: 1 }}>
                      <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: isSelected ? 'var(--primary)' : 'var(--text-main)' }}>
                        {item.charId === 'pookie' ? getCompanionName() : item.name}
                      </h5>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.preview}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Companion Stats Footer Widget */}
      {activeCharacter && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--card-border)',
          borderRadius: 'var(--border-radius-md)',
          padding: '12px 14px',
          marginBottom: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.6rem' }}>{activeCharacter.avatar}</span>
            <div style={{ overflow: 'hidden' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getCompanionName()}
              </h4>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{activeCharacter.personality}</p>
            </div>
          </div>
          <div style={{ marginTop: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
              <span>LVL {activeRelationship.level} - {activeRelationship.levelName}</span>
              <span>{activeRelationship.xp} XP</span>
            </div>
            <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${getSidebarProgress()}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, var(--primary), var(--secondary))' 
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="glass-button"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '10px',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          borderRadius: 'var(--border-radius-sm)',
          cursor: 'pointer',
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 600,
          fontSize: '0.85rem'
        }}
      >
        <LogOut size={16} />
        <span>Logout</span>
      </button>
    </aside>
  );
};

export default Sidebar;
