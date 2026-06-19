import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCharacter } from '../context/CharacterContext.jsx';
import { apiCall } from '../services/api.js';
import { Database, Upload, AlertCircle, CheckCircle, FileText, Play } from 'lucide-react';

const DatasetManager = () => {
  const { getAuthHeaders } = useAuth();
  const { characters } = useCharacter();

  const [selectedChar, setSelectedChar] = useState('');
  const [fileContent, setFileContent] = useState(null);
  const [fileName, setFileName] = useState('');
  const [overwrite, setOverwrite] = useState(true);
  
  // States
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [entriesPreview, setEntriesPreview] = useState([]);
  
  // Existing Entries
  const [existingCount, setExistingCount] = useState(0);

  // Initialize selected character
  useEffect(() => {
    if (characters && characters.length > 0) {
      setSelectedChar(characters[0].id);
    }
  }, [characters]);

  // Fetch current entries count when character switches
  useEffect(() => {
    if (!selectedChar) return;
    fetchCurrentCount();
  }, [selectedChar]);

  const fetchCurrentCount = async () => {
    try {
      const data = await apiCall(`/api/datasets/${selectedChar}`, 'GET', null, getAuthHeaders);
      setExistingCount(data ? data.length : 0);
    } catch (err) {
      console.warn('Could not fetch existing dataset count:', err.message);
      setExistingCount(0);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (!Array.isArray(json)) {
          throw new Error('Dataset file must be a JSON array containing objects.');
        }

        // Validate first entry format
        if (json.length > 0) {
          const entry = json[0];
          const query = entry.user || entry.user_query;
          const response = entry.assistant || entry.assistant_response;

          if (!query || !response) {
            throw new Error('Entries must contain "user" and "assistant" text properties.');
          }
        }

        setFileContent(json);
        // Preview first 5 entries
        setEntriesPreview(json.slice(0, 5));
      } catch (err) {
        setError(`Invalid JSON dataset: ${err.message}`);
        setFileContent(null);
        setEntriesPreview([]);
      }
    };
    reader.readAsText(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedChar) return setError('Please select a companion character.');
    if (!fileContent) return setError('Please select a valid JSON dataset file.');

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiCall('/api/datasets/upload', 'POST', {
        characterId: selectedChar,
        entries: fileContent,
        overwrite
      }, getAuthHeaders);

      setSuccess(response.message || 'Dataset uploaded successfully!');
      setFileContent(null);
      setFileName('');
      setEntriesPreview([]);
      fetchCurrentCount();
    } catch (err) {
      console.error('Dataset upload error:', err);
      setError(err.message || 'Failed to upload dataset to server.');
    } finally {
      setLoading(false);
    }
  };

  const triggerIndexReload = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await apiCall('/api/datasets/reload', 'POST', {}, getAuthHeaders);
      if (response.success) {
        setSuccess('TF-IDF Semantic cache reloaded successfully!');
      } else {
        setError('Failed to reload dataset cache.');
      }
    } catch (err) {
      setError(err.message || 'Failed to reload dataset cache.');
    } finally {
      setLoading(false);
    }
  };

  const getCharAvatar = (charId) => {
    const char = characters.find(c => c.id === charId);
    return char ? char.avatar : '💕';
  };

  return (
    <div style={{ paddingBottom: '40px', maxWidth: '800px', margin: '0 auto' }} className="animate-fade-in">
      
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Database size={28} />
          <span>Dataset Manager</span>
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Configure semantic matching datasets to act as the primary personality brain for your companions.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Main form card */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📤 Upload Custom Dialogue Rules</span>
          </h3>

          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Character selection dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Select Companion</label>
              <select
                value={selectedChar}
                onChange={(e) => setSelectedChar(e.target.value)}
                className="glass-input"
                style={{ background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--card-border)' }}
              >
                {characters.map(c => (
                  <option key={c.id} value={c.id} style={{ background: '#1c1926', color: 'white' }}>
                    {c.avatar} {c.name} ({c.personality})
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '2px', fontWeight: 600 }}>
                Current database entries: {existingCount} rows
              </span>
            </div>

            {/* Overwrite or Append toggle */}
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Upload Mode:</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="radio"
                  name="overwrite"
                  checked={overwrite}
                  onChange={() => setOverwrite(true)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                Replace existing database records (Overwrite)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="radio"
                  name="overwrite"
                  checked={!overwrite}
                  onChange={() => setOverwrite(false)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                Append to current records
              </label>
            </div>

            {/* File Upload Box */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Dataset JSON File</label>
              <div style={{
                border: '2px dashed var(--card-border)',
                borderRadius: 'var(--border-radius-md)',
                padding: '30px 20px',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.01)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'border-color 0.2s'
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleFileChange({ target: { files: [file] } });
              }}
              >
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: 0,
                    cursor: 'pointer',
                    width: '100%',
                    height: '100%'
                  }}
                />
                <Upload size={32} style={{ color: 'var(--text-muted)', marginBottom: '10px' }} />
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {fileName ? fileName : 'Click to select or drag & drop dataset JSON file'}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Format: Array of objects with "user" and "assistant" text keys
                </p>
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                padding: '12px',
                borderRadius: 'var(--border-radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.85rem'
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                color: '#10b981',
                padding: '12px',
                borderRadius: 'var(--border-radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.85rem'
              }}>
                <CheckCircle size={16} />
                <span>{success}</span>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                onClick={triggerIndexReload}
                className="glass-button"
                style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}
                disabled={loading}
              >
                <Play size={16} />
                <span>Rebuild Index Cache</span>
              </button>

              <button
                type="submit"
                className="glass-button glass-button-primary"
                style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '6px' }}
                disabled={loading || !fileContent}
              >
                <Upload size={16} />
                <span>{loading ? 'Uploading...' : 'Upload Dataset'}</span>
              </button>
            </div>

          </form>
        </div>

        {/* Dataset Preview Card */}
        {entriesPreview.length > 0 && (
          <div className="glass-card animate-slide-in">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} />
              <span>Preview Upload Entries (First {entriesPreview.length} rows)</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {entriesPreview.map((item, idx) => (
                <div key={idx} style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--card-border)',
                  background: 'rgba(255,255,255,0.01)',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>User: </span>
                    <span style={{ color: 'var(--text-main)' }}>"{item.user || item.user_query}"</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Companion: </span>
                    <span style={{ color: 'var(--text-muted)' }}>"{item.assistant || item.assistant_response}"</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DatasetManager;
