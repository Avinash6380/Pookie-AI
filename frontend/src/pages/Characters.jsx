import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCharacter } from '../context/CharacterContext.jsx';
import { MessageSquare, Heart, Shield, CheckCircle } from 'lucide-react';

const Characters = () => {
  const { characters, activeCharacter, setActiveCharacter, activeRelationship } = useCharacter();
  const navigate = useNavigate();

  const handleSelectCharacter = (char) => {
    setActiveCharacter(char);
  };

  const handleChatNow = (char) => {
    setActiveCharacter(char);
    navigate('/chat');
  };

  return (
    <div style={{ paddingBottom: '40px' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Companion Characters</h2>
        <p style={{ color: 'var(--text-muted)' }}>Choose your companion persona. Each character has a unique personality and relationship level.</p>
      </div>

      {/* Grid */}
      <div className="dashboard-grid">
        {characters.map((char) => {
          const isActive = activeCharacter?.id === char.id;
          
          return (
            <div 
              key={char.id} 
              className={`glass-card ${isActive ? 'level-up-flash' : ''}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                border: isActive ? '1px solid var(--primary)' : '1px solid var(--card-border)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'var(--primary-glow)',
                  border: '1px solid var(--primary)',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  fontFamily: 'Outfit, sans-serif'
                }}>
                  <CheckCircle size={12} />
                  <span>Active Partner</span>
                </div>
              )}

              {/* Header Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: isActive ? '8px' : '0' }}>
                <span style={{ fontSize: '3rem', display: 'block' }}>{char.avatar}</span>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>{char.name}</h3>
                  <span style={{
                    fontSize: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--card-border)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    color: 'var(--primary)',
                    fontWeight: 600
                  }}>
                    {char.personality}
                  </span>
                </div>
              </div>

              {/* Bio/Instructions Prompt */}
              <p style={{
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                lineHeight: '1.5',
                flexGrow: 1
              }}>
                {char.prompt.replace(/You are .*, the user's .*\. /gi, '').substring(0, 150)}...
              </p>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                {!isActive ? (
                  <button
                    onClick={() => handleSelectCharacter(char)}
                    className="glass-button"
                    style={{ flexGrow: 1 }}
                  >
                    Select
                  </button>
                ) : (
                  <div style={{
                    flexGrow: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    color: 'var(--primary)',
                    fontWeight: 600
                  }}>
                    Currently Chatting
                  </div>
                )}
                <button
                  onClick={() => handleChatNow(char)}
                  className="glass-button glass-button-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <MessageSquare size={16} />
                  <span>Chat</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Characters;
