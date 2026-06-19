import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';
import { apiCall } from '../services/api.js';

const CharacterContext = createContext();

export const CharacterProvider = ({ children }) => {
  const { user, getAuthHeaders } = useAuth();
  const [characters, setCharacters] = useState([]);
  const [activeCharacter, setActiveCharacterState] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [activeRelationship, setActiveRelationship] = useState({ level: 1, xp: 0, levelName: 'Stranger' });
  const [loading, setLoading] = useState(true);

  // Fetch characters and initial preferences when user session changes
  useEffect(() => {
    if (!user) {
      setCharacters([]);
      setActiveCharacterState(null);
      setPreferences(null);
      setLoading(false);
      return;
    }

    const initData = async () => {
      setLoading(true);
      try {
        // Fetch characters list
        const chars = await apiCall('/api/characters', 'GET', null, getAuthHeaders);
        setCharacters(chars);

        // Fetch preferences (assistant name, personality, theme)
        const prefs = await apiCall('/api/settings', 'GET', null, getAuthHeaders);
        setPreferences(prefs);

        // Find active character (default to 'pookie')
        const defaultChar = chars.find(c => c.id === 'pookie') || chars[0];
        setActiveCharacterState(defaultChar);
      } catch (err) {
        console.error('CharacterContext initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [user]);

  // Fetch relationship state whenever the active character changes
  // Fetch relationship state whenever the active character changes
  useEffect(() => {
    if (!user || !activeCharacter) return;

    const fetchRelationship = async () => {
      try {
        const profile = await apiCall('/api/profile', 'GET', null, getAuthHeaders);
        const rels = profile.relationships || [];
        const rel = rels.find(r => r.character_id === activeCharacter.id) || { level: 1, xp: 0 };
        
        const LEVEL_NAMES = {
          1: 'Stranger',
          2: 'Friend',
          3: 'Close Friend',
          4: 'Partner',
          5: 'Soulmate'
        };

        setActiveRelationship({
          level: rel.level,
          xp: rel.xp,
          levelName: LEVEL_NAMES[rel.level] || 'Stranger'
        });
      } catch (err) {
        console.error('Fetch relationship status error:', err);
      }
    };

    fetchRelationship();
  }, [activeCharacter, user]);

  const setActiveCharacter = (char) => {
    setActiveCharacterState(char);
  };

  const updatePreferences = async (newPrefs) => {
    try {
      const updated = await apiCall('/api/settings', 'PUT', newPrefs, getAuthHeaders);
      setPreferences(updated);
      return updated;
    } catch (err) {
      console.error('Update preferences error:', err);
      throw err;
    }
  };

  const value = {
    characters,
    activeCharacter,
    setActiveCharacter,
    preferences,
    updatePreferences,
    activeRelationship,
    setActiveRelationship,
    loading
  };

  return (
    <CharacterContext.Provider value={value}>
      {children}
    </CharacterContext.Provider>
  );
};

export const useCharacter = () => {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error('useCharacter must be used within a CharacterProvider');
  }
  return context;
};
export default CharacterContext;
