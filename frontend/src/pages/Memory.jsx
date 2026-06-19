import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiCall } from '../services/api.js';
import { Brain, Plus, Trash2, Tag, Star, Loader, AlertCircle } from 'lucide-react';

const Memory = () => {
  const { getAuthHeaders } = useAuth();
  const [memories, setMemories] = useState([]);
  const [fact, setFact] = useState('');
  const [importance, setImportance] = useState(3);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [error, setError] = useState(null);

  const suggestionTags = [
    { label: "🍔 Favorite Food", text: "My favorite food is " },
    { label: "🎵 Favorite Music", text: "My favorite music genre is " },
    { label: "🎨 Favorite Color", text: "My favorite color is " },
    { label: "🎮 Hobbies", text: "In my free time, I love " },
    { label: "🎯 Personal Goals", text: "My main goal in life is " },
    { label: "💼 Occupation", text: "I work as a " }
  ];

  const fetchMemories = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/api/memories', 'GET', null, getAuthHeaders);
      setMemories(data);
    } catch (err) {
      console.error('Fetch memories error:', err);
      setError('Failed to load memories database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [getAuthHeaders]);

  const handleAddMemory = async (e) => {
    e.preventDefault();
    if (!fact.trim()) return;

    setBtnLoading(true);
    setError(null);
    try {
      const newMemory = await apiCall('/api/memories', 'POST', {
        fact: fact.trim(),
        importance
      }, getAuthHeaders);

      setMemories([newMemory, ...memories]);
      setFact('');
      setImportance(3);
    } catch (err) {
      console.error('Add memory error:', err);
      setError('Failed to save memory.');
    } finally {
      setBtnLoading(false);
    }
  };

  const handleDeleteMemory = async (id) => {
    try {
      await apiCall(`/api/memories/${id}`, 'DELETE', null, getAuthHeaders);
      setMemories(memories.filter(m => m.id !== id));
    } catch (err) {
      console.error('Delete memory error:', err);
      setError('Failed to delete memory.');
    }
  };

  const handleTagClick = (text) => {
    setFact(text);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Loader className="animate-spin" size={40} style={{ color: 'var(--primary)', animation: 'bounce 1s infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '40px', maxWidth: '900px', margin: '0 auto' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Brain size={28} style={{ color: 'var(--primary)' }} />
          <span>Companion Memory System</span>
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Manage the facts that Pookie and other companions remember about you. These facts are dynamically injected into conversation models.
        </p>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          padding: '12px 16px',
          borderRadius: 'var(--border-radius-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '24px',
          fontSize: '0.9rem'
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Layout Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Form & Suggestions */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Record a New Fact</h3>
          
          <form onSubmit={handleAddMemory} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                placeholder="E.g., I love reading sci-fi books before sleeping..."
                value={fact}
                onChange={(e) => setFact(e.target.value)}
                className="glass-input"
                style={{ flexGrow: 1, padding: '12px 16px' }}
                maxLength={200}
                required
              />
              <button
                type="submit"
                className="glass-button glass-button-primary"
                style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}
                disabled={btnLoading}
              >
                <Plus size={18} />
                <span>{btnLoading ? 'Saving...' : 'Add Fact'}</span>
              </button>
            </div>

            {/* Importance and Suggestion tags row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Importance:</span>
                <select
                  value={importance}
                  onChange={(e) => setImportance(parseInt(e.target.value, 10))}
                  className="glass-input"
                  style={{ padding: '6px 12px', fontSize: '0.85rem', background: 'var(--input-bg)', color: 'var(--text-main)' }}
                >
                  <option value="1">1 - Low Priority</option>
                  <option value="3">3 - Medium Priority</option>
                  <option value="5">5 - Core Priority</option>
                </select>
              </div>

              {/* Suggestions header */}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                💡 Click suggestion tags below to autofill
              </span>
            </div>
          </form>

          {/* Suggestion Tags list */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
            {suggestionTags.map((tag) => (
              <button
                key={tag.label}
                onClick={() => handleTagClick(tag.text)}
                className="glass-button"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Tag size={12} />
                <span>{tag.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Saved Memory List */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Active Memories Database</h3>
          
          {memories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
              <Brain size={48} style={{ margin: '0 auto 12px auto', display: 'block', color: 'var(--text-muted)' }} />
              <p style={{ fontSize: '0.9rem' }}>No facts recorded yet. Record some preferences to personalize conversations!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {memories.map((mem) => (
                <div 
                  key={mem.id}
                  className="glass-card glass-card-hover"
                  style={{
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    position: 'relative',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--card-border)'
                  }}
                >
                  <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-main)' }}>{mem.fact}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--primary)' }}>
                      <Star size={12} fill="var(--primary)" />
                      <span>Priority {mem.importance}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteMemory(mem.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        borderRadius: '4px',
                        transition: 'background var(--transition-fast)'
                      }}
                      className="delete-fact-btn"
                      title="Forget this fact"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Memory;
