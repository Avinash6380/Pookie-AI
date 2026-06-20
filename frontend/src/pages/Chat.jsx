import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCharacter } from '../context/CharacterContext.jsx';
import { apiCall } from '../services/api.js';
import { exportToTxt, exportToPdf } from '../utils/exportChat.js';
import { 
  Send, 
  Mic, 
  Volume2, 
  VolumeX,
  Search, 
  Trash2, 
  Download, 
  Smile, 
  Heart, 
  Sparkles,
  AlertCircle,
  Loader,
  Phone,
  Settings as SettingsIcon,
  Paperclip,
  PhoneOff,
  MicOff
} from 'lucide-react';

const Chat = () => {
  const { getAuthHeaders, user } = useAuth();
  const { activeCharacter, activeRelationship, setActiveRelationship, preferences } = useCharacter();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  // Voice State Settings (backed by localStorage)
  const [voiceInputSupported, setVoiceInputSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceInputEnabled, setVoiceInputEnabled] = useState(() => localStorage.getItem('pookie-voice-input') === 'true');
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(() => localStorage.getItem('pookie-voice-output') === 'true');
  
  // Reaction states
  const [activeReactionMenu, setActiveReactionMenu] = useState(null); // stores messageId
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false);
  const [showAttachmentDrawer, setShowAttachmentDrawer] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [floatingEmojis, setFloatingEmojis] = useState([]); // { id, emoji, messageId }
  const [showHeartBurst, setShowHeartBurst] = useState(false);

  // Voice Call Modal States
  const [showVoiceCallModal, setShowVoiceCallModal] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallMuted, setIsCallMuted] = useState(false);
  const [isSpeakerActive, setIsSpeakerActive] = useState(true);
  
  // Level Up Alert
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState(null); // { x, y, message }

  // Speech Synthesis States
  const [currentlyReading, setCurrentlyReading] = useState(null);
  const [speechState, setSpeechState] = useState('stopped'); // 'playing', 'paused', 'stopped'

  // Touch long press refs
  const touchTimerRef = useRef(null);
  const touchStartPos = useRef({ x: 0, y: 0 });

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const callTimerRef = useRef(null);

  const getCompanionName = () => {
    if (!activeCharacter) return 'Companion';
    if (activeCharacter.id === 'pookie' && preferences?.assistant_name) {
      return preferences.assistant_name;
    }
    return activeCharacter.name;
  };

  // 1. Fetch Chat History and Initialize Voice recognition
  useEffect(() => {
    if (!activeCharacter) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const history = await apiCall(`/api/chat/history/${activeCharacter.id}`, 'GET', null, getAuthHeaders);
        setMessages(history);
      } catch (err) {
        console.error('Fetch history error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();

    // Check Speech Recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceInputSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.lang = 'en-US';
      rec.interimResults = false;

      rec.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setNewMessage(prev => prev ? prev + ' ' + text : text);
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [activeCharacter, getAuthHeaders]);

  // 2. Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiTyping]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
      }
    };
  }, []);

  // Close context menu on click outside
  useEffect(() => {
    const handleCloseMenu = (e) => {
      if (contextMenu && !e.target.closest('.custom-context-menu')) {
        setContextMenu(null);
      }
    };
    window.addEventListener('mousedown', handleCloseMenu);
    window.addEventListener('touchstart', handleCloseMenu);
    return () => {
      window.removeEventListener('mousedown', handleCloseMenu);
      window.removeEventListener('touchstart', handleCloseMenu);
    };
  }, [contextMenu]);

  // 3. Voice call timer effect
  useEffect(() => {
    if (showVoiceCallModal) {
      setCallDuration(0);
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      
      // Optionally read a greeting aloud when call starts
      speakText(`Hey, it's ${getCompanionName()}! I'm so happy to talk to you. How is your day going?`);
    } else {
      clearInterval(callTimerRef.current);
      window.speechSynthesis.cancel();
    }

    return () => clearInterval(callTimerRef.current);
  }, [showVoiceCallModal]);

  // Format call duration to 00:00 style
  const formatCallTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Speak companion reply aloud (for Call Simulation)
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voiceName = localStorage.getItem('pookie-voice-type') || '';
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.name === voiceName) || 
                  voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Zira'))) || 
                  voices[0];
    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = parseFloat(localStorage.getItem('pookie-speech-rate') || '1.0');
    utterance.pitch = parseFloat(localStorage.getItem('pookie-speech-pitch') || '1.0');
    utterance.volume = parseFloat(localStorage.getItem('pookie-speech-volume') || '1.0');

    window.speechSynthesis.speak(utterance);
  };

  // Manual Read Aloud functions
  const startReadAloud = (msg) => {
    if (!('speechSynthesis' in window)) {
      alert("Speech synthesis is not supported in this browser.");
      return;
    }
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(msg.content);
    const voiceName = localStorage.getItem('pookie-voice-type') || '';
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.name === voiceName) || 
                  voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Zira'))) || 
                  voices[0];
    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = parseFloat(localStorage.getItem('pookie-speech-rate') || '1.0');
    utterance.pitch = parseFloat(localStorage.getItem('pookie-speech-pitch') || '1.0');
    utterance.volume = parseFloat(localStorage.getItem('pookie-speech-volume') || '1.0');

    utterance.onstart = () => {
      setSpeechState('playing');
    };
    utterance.onend = () => {
      setCurrentlyReading(null);
      setSpeechState('stopped');
    };
    utterance.onerror = () => {
      setCurrentlyReading(null);
      setSpeechState('stopped');
    };

    setCurrentlyReading(msg);
    setSpeechState('playing');
    window.speechSynthesis.speak(utterance);
  };

  const handlePauseSpeech = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setSpeechState('paused');
    }
  };

  const handleResumeSpeech = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setSpeechState('playing');
    }
  };

  const handleStopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setCurrentlyReading(null);
      setSpeechState('stopped');
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      await apiCall(`/api/chat/message/${msgId}`, 'DELETE', null, getAuthHeaders);
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (err) {
      console.error("Delete message error:", err);
      alert("Failed to delete message: " + err.message);
    }
  };

  const handleShareMessage = async (msg) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Message from ${getCompanionName()}`,
          text: msg.content
        });
      } catch (err) {
        console.error("Share error:", err);
      }
    } else {
      navigator.clipboard.writeText(msg.content);
      alert("Sharing is not supported on this platform. Message copied to clipboard!");
    }
  };

  // Context Menu placement boundary helper
  const adjustContextMenuPos = (clientX, clientY) => {
    const menuWidth = 170;
    const menuHeight = 190;
    let x = clientX;
    let y = clientY;
    
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }
    return { x, y };
  };

  const handleContextMenu = (e, msg) => {
    e.preventDefault();
    const pos = adjustContextMenuPos(e.clientX, e.clientY);
    setContextMenu({
      ...pos,
      message: msg
    });
  };

  // Mobile Long Press
  const handleTouchStart = (e, msg) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    
    touchTimerRef.current = setTimeout(() => {
      const pos = adjustContextMenuPos(touch.clientX, touch.clientY);
      setContextMenu({
        ...pos,
        message: msg
      });
      if (navigator.vibrate) {
        navigator.vibrate(60);
      }
    }, 600);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPos.current.x);
    const dy = Math.abs(touch.clientY - touchStartPos.current.y);
    if (dx > 12 || dy > 12) {
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
        touchTimerRef.current = null;
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  // Toggle voice settings
  const toggleVoiceOutput = () => {
    const newState = !voiceOutputEnabled;
    setVoiceOutputEnabled(newState);
    localStorage.setItem('pookie-voice-output', newState);
    if (!newState) {
      window.speechSynthesis.cancel();
    }
  };

  const handleMicrophoneClick = () => {
    if (!voiceInputSupported || !recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || aiTyping) return;

    const userText = newMessage.trim();
    setNewMessage('');
    setShowInputEmojiPicker(false);
    setChatError(null);

    const localUserMsg = {
      id: 'temp-user',
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, localUserMsg]);
    setAiTyping(true);

    try {
      const response = await apiCall('/api/chat', 'POST', {
        message: userText,
        characterId: activeCharacter.id
      }, getAuthHeaders);

      setMessages(prev => prev.filter(m => m.id !== 'temp-user').concat([
        response.userMessage,
        response.aiMessage
      ]));

      // Update levels using count-based fields
      setActiveRelationship({
        level: response.relationship.level,
        totalMessages: response.relationship.totalMessages,
        nextLevelTarget: response.relationship.nextLevelTarget,
        levelName: response.relationship.levelName
      });

      if (response.relationship.didLevelUp) {
        setLevelUpData({
          companion: getCompanionName(),
          level: response.relationship.level,
          levelName: response.relationship.levelName
        });
        setShowLevelUpModal(true);
      }

    } catch (err) {
      console.error('Send message error:', err);
      setChatError(err.message || 'Failed to get response. Please try again.');
      // Remove temporary message since send failed
      setMessages(prev => prev.filter(m => m.id !== 'temp-user'));
    } finally {
      setAiTyping(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm(`Are you sure you want to clear your conversation history with ${getCompanionName()}?`)) return;

    try {
      await apiCall(`/api/chat/history/${activeCharacter.id}`, 'DELETE', null, getAuthHeaders);
      setMessages([]);
      window.speechSynthesis.cancel();
    } catch (err) {
      console.error('Clear chat error:', err);
    }
  };

  const triggerFloatingEmoji = (messageId, emoji) => {
    const id = Math.random().toString();
    setFloatingEmojis(prev => [...prev, { id, emoji, messageId }]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(item => item.id !== id));
    }, 1500);
  };

  const triggerHeartBurst = () => {
    setShowHeartBurst(true);
    setTimeout(() => {
      setShowHeartBurst(false);
    }, 1500);
  };

  const handleToggleReaction = async (messageId, reactionEmoji) => {
    try {
      const response = await apiCall('/api/chat/reactions', 'POST', {
        messageId,
        reaction: reactionEmoji
      }, getAuthHeaders);
      
      setMessages(prev => prev.map(m => {
        if (m.id !== messageId) return m;
        
        let newReactions = [...(m.reactions || [])];
        if (response.action === 'removed') {
          newReactions = newReactions.filter(r => r.userId !== user?.id);
        } else if (response.action === 'updated') {
          const exists = newReactions.some(r => r.userId === user?.id);
          if (exists) {
            newReactions = newReactions.map(r => r.userId === user?.id ? { userId: user?.id, reaction: reactionEmoji } : r);
          } else {
            newReactions.push({ userId: user?.id, reaction: reactionEmoji });
          }
        } else if (response.action === 'added') {
          newReactions.push({ userId: user?.id, reaction: reactionEmoji });
        }
        
        return {
          ...m,
          reactions: newReactions
        };
      }));

      if (response.action === 'added' || response.action === 'updated') {
        triggerFloatingEmoji(messageId, reactionEmoji);
        if (reactionEmoji === '❤️') {
          triggerHeartBurst();
        }
      }
      setActiveReactionMenu(null);
    } catch (err) {
      console.error('Toggle reaction error:', err);
    }
  };

  const getReactionGroups = (reactions) => {
    if (!reactions || reactions.length === 0) return [];
    const groups = {};
    reactions.forEach(r => {
      if (!groups[r.reaction]) {
        groups[r.reaction] = {
          emoji: r.reaction,
          count: 0,
          userReacted: false,
          aiReacted: false
        };
      }
      groups[r.reaction].count += 1;
      if (r.userId === user?.id) {
        groups[r.reaction].userReacted = true;
      }
      if (r.userId === null) {
        groups[r.reaction].aiReacted = true;
      }
    });
    return Object.values(groups);
  };

  const handleExportTxt = () => exportToTxt(getCompanionName(), messages);
  const handleExportPdf = () => exportToPdf(getCompanionName(), messages);

  // Append emoji to text bar
  const handleInputEmojiClick = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowInputEmojiPicker(false);
  };

  const filteredMessages = messages.filter(msg => 
    msg.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="chat-window animate-fade-in" style={{ position: 'relative' }}>
      
      {/* 1. Header Area */}
      <div className="glass-panel" style={{
        padding: '12px 20px',
        borderRadius: 'var(--border-radius-md)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '16px',
        border: '1px solid var(--card-border)'
      }}>
        {/* Companion Avatar, Custom Name, Status Dot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '2.2rem' }}>{activeCharacter?.avatar}</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{getCompanionName()}</h3>
              {/* Online Status Dot */}
              <div 
                style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} 
                title="Online status"
              />
              <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 600 }}>Online</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
              LVL {activeRelationship.level} • {activeRelationship.levelName}
            </span>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Search Toggle */}
          <button 
            onClick={() => setShowSearch(!showSearch)} 
            className="glass-button" 
            style={{ padding: '8px' }}
            title="Search conversation"
          >
            <Search size={16} />
          </button>



          {/* Settings Shortcut Button */}
          <Link
            to="/settings"
            className="glass-button"
            style={{ padding: '8px' }}
            title="Companion settings"
          >
            <SettingsIcon size={16} />
          </Link>

          {/* Export Dropdown Trigger */}
          <div style={{ position: 'relative' }} className="export-dropdown-group">
            <button 
              className="glass-button" 
              style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={(e) => {
                const el = e.currentTarget.nextElementSibling;
                el.style.display = el.style.display === 'flex' ? 'none' : 'flex';
              }}
            >
              <Download size={14} />
              <span style={{ fontSize: '0.8rem' }}>Export</span>
            </button>
            <div style={{
              position: 'absolute',
              top: '38px',
              right: 0,
              display: 'none',
              flexDirection: 'column',
              background: 'var(--sidebar-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: 'var(--border-radius-sm)',
              boxShadow: 'var(--card-shadow)',
              zIndex: 30,
              minWidth: '120px',
              overflow: 'hidden'
            }}>
              <button 
                onClick={(e) => {
                  e.currentTarget.parentElement.style.display = 'none';
                  handleExportTxt();
                }}
                className="glass-button"
                style={{ width: '100%', border: 'none', borderRadius: 0, padding: '10px', fontSize: '0.8rem' }}
              >
                As Text (.TXT)
              </button>
              <button 
                onClick={(e) => {
                  e.currentTarget.parentElement.style.display = 'none';
                  handleExportPdf();
                }}
                className="glass-button"
                style={{ width: '100%', border: 'none', borderRadius: 0, padding: '10px', fontSize: '0.8rem' }}
              >
                As PDF (.PDF)
              </button>
            </div>
          </div>

          {/* Toggle TTS */}
          <button 
            onClick={toggleVoiceOutput} 
            className="glass-button"
            style={{ padding: '8px' }}
            title={voiceOutputEnabled ? "Disable Text-to-Speech auto-read" : "Enable Text-to-Speech auto-read"}
          >
            {voiceOutputEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Delete History */}
          <button 
            onClick={handleClearHistory} 
            className="glass-button" 
            style={{ padding: '8px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}
            title="Clear chat history"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Search Bar Panel */}
      {showSearch && (
        <div className="glass-panel animate-slide-in" style={{
          padding: '8px 16px',
          borderRadius: 'var(--border-radius-sm)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          marginBottom: '12px',
          border: '1px solid var(--card-border)'
        }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search keywords in messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input"
            style={{ flexGrow: 1, border: 'none', background: 'transparent', padding: '4px' }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="glass-button" 
              style={{ padding: '2px 8px', fontSize: '0.75rem' }}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* 2. Messages Display Area */}
      <div className="chat-messages glass-panel" style={{
        borderRadius: 'var(--border-radius-md)',
        border: '1px solid var(--card-border)',
        marginBottom: '16px'
      }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Loader className="animate-spin" size={32} style={{ color: 'var(--primary)', animation: 'bounce 1s infinite' }} />
          </div>
        ) : filteredMessages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', opacity: 0.5, padding: '24px' }}>
            <span style={{ fontSize: '3rem' }}>💬</span>
            <p style={{ marginTop: '12px', fontSize: '0.9rem' }}>
              {searchQuery ? 'No messages match search keywords' : `Start your conversation with ${getCompanionName()}!`}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isUser = msg.role === 'user';
            const isSpeaking = !isUser && currentlyReading?.id === msg.id && speechState === 'playing';
            const reactionGroups = getReactionGroups(msg.reactions);
            const hasReactions = reactionGroups.length > 0;
            
            return (
              <div 
                key={msg.id} 
                className={`chat-bubble ${isUser ? 'user' : 'ai'} ${isSpeaking ? 'speaking' : ''}`}
                style={{ 
                  paddingBottom: hasReactions ? '26px' : '12px', 
                  position: 'relative' 
                }}
                onMouseLeave={() => setActiveReactionMenu(null)}
                onContextMenu={(e) => handleContextMenu(e, msg)}
                onTouchStart={(e) => handleTouchStart(e, msg)}
                onTouchMove={(e) => handleTouchMove(e)}
                onTouchEnd={() => handleTouchEnd()}
              >
                <p style={{ fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                  {isSpeaking && (
                    <span className="bubble-equalizer">
                      <span className="eq-bar" />
                      <span className="eq-bar" />
                      <span className="eq-bar" />
                      <span className="eq-bar" />
                    </span>
                  )}
                </p>

                {/* Floating Emoji Indicators inside the bubble */}
                {floatingEmojis.filter(fe => fe.messageId === msg.id).map(fe => (
                  <span key={fe.id} className="floating-emoji-indicator">
                    {fe.emoji}
                  </span>
                ))}

                {/* Reaction Badges */}
                {hasReactions && (
                  <div className="message-reaction-badges" style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    position: 'absolute',
                    bottom: '-8px',
                    left: isUser ? 'auto' : '12px',
                    right: isUser ? '12px' : 'auto',
                    zIndex: 2
                  }}>
                    {reactionGroups.map(group => (
                      <button
                        key={group.emoji}
                        type="button"
                        className={`reaction-badge ${group.userReacted ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleReaction(msg.id, group.emoji);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          background: group.userReacted ? 'rgba(255, 79, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          border: group.userReacted ? '1px solid var(--primary)' : '1px solid var(--card-border)',
                          borderRadius: '12px',
                          padding: '2px 6px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          color: group.userReacted ? 'var(--primary)' : 'var(--text-main)',
                          transition: 'all 0.2s ease',
                          pointerEvents: 'auto'
                        }}
                        title={
                          `${group.count} reaction(s) (${group.userReacted ? 'You' : ''}${group.userReacted && group.aiReacted ? ' & ' : ''}${group.aiReacted ? 'AI' : ''})`
                        }
                      >
                        <span>{group.emoji}</span>
                        {group.count > 1 && <span style={{ fontWeight: 600 }}>{group.count}</span>}
                      </button>
                    ))}
                  </div>
                )}

                {/* Hover Smile reactions trigger */}
                <button
                  onClick={() => setActiveReactionMenu(activeReactionMenu === msg.id ? null : msg.id)}
                  style={{
                    position: 'absolute',
                    right: isUser ? 'auto' : '-32px',
                    left: isUser ? '-32px' : 'auto',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    zIndex: 5
                  }}
                  className="reaction-trigger-btn"
                  title="React with emoji"
                  type="button"
                >
                  <Smile size={16} />
                </button>

                {activeReactionMenu === msg.id && (
                  <div className="emoji-selector animate-fade-in" style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: isUser ? '0' : 'auto',
                    right: isUser ? 'auto' : '0',
                    background: 'var(--sidebar-bg)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '20px',
                    padding: '4px 8px',
                    display: 'flex',
                    gap: '6px',
                    zIndex: 10,
                    boxShadow: 'var(--card-shadow)',
                    marginBottom: '4px'
                  }}>
                    {['❤️', '🥰', '😂', '😢', '👍', '🔥'].map(emoji => (
                      <span 
                        key={emoji}
                        className="emoji-option"
                        style={{ cursor: 'pointer', fontSize: '1.1rem' }}
                        onClick={() => handleToggleReaction(msg.id, emoji)}
                      >
                        {emoji}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}

        {aiTyping && (
          <div className="typing-indicator">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '6px' }}>{getCompanionName()} is typing</span>
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Input Toolbar Area */}
      <div style={{ position: 'relative' }}>
        
        {/* Attachment Drawer Popover */}
        {showAttachmentDrawer && (
          <div className="glass-panel animate-slide-in" style={{
            position: 'absolute',
            bottom: '60px',
            left: '10px',
            padding: '10px',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--card-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 40,
            boxShadow: 'var(--card-shadow)'
          }}>
            <button 
              type="button" 
              className="glass-button" 
              style={{ padding: '8px 12px', fontSize: '0.8rem', justifyContent: 'flex-start' }}
              onClick={() => { setShowAttachmentDrawer(false); alert('Send Image is a UI placeholder.'); }}
            >
              🖼️ Send Image
            </button>
            <button 
              type="button" 
              className="glass-button" 
              style={{ padding: '8px 12px', fontSize: '0.8rem', justifyContent: 'flex-start' }}
              onClick={() => { setShowAttachmentDrawer(false); alert('Send Audio is a UI placeholder.'); }}
            >
              🎵 Send Audio Note
            </button>
            <button 
              type="button" 
              className="glass-button" 
              style={{ padding: '8px 12px', fontSize: '0.8rem', justifyContent: 'flex-start' }}
              onClick={() => { setShowAttachmentDrawer(false); alert('Send Document is a UI placeholder.'); }}
            >
              📄 Send Document
            </button>
          </div>
        )}

        {/* Input Emoji Picker Popover */}
        {showInputEmojiPicker && (
          <div className="glass-panel animate-slide-in" style={{
            position: 'absolute',
            bottom: '60px',
            right: '50px',
            padding: '8px 12px',
            borderRadius: '20px',
            border: '1px solid var(--card-border)',
            display: 'flex',
            gap: '8px',
            zIndex: 40,
            boxShadow: 'var(--card-shadow)'
          }}>
            {['❤️', '🥰', '😘', '😂', '😢', '😍', '✨', '🌹'].map(emoji => (
              <span 
                key={emoji} 
                style={{ cursor: 'pointer', fontSize: '1.2rem', transition: 'transform 0.2s' }}
                onClick={() => handleInputEmojiClick(emoji)}
                className="emoji-option"
              >
                {emoji}
              </span>
            ))}
          </div>
        )}

        {chatError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            padding: '10px 14px',
            borderRadius: 'var(--border-radius-sm)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '10px',
            animation: 'fadeIn var(--transition-fast)'
          }}>
            <AlertCircle size={16} />
            <span>{chatError}</span>
          </div>
        )}

        {/* Mini Audio Control Bar (Pause, Resume, Stop) */}
        {currentlyReading && (
          <div className="mini-audio-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <span style={{ fontSize: '1rem', animation: 'bounce 1.5s infinite' }}>🔊</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                Reading Aloud: "{currentlyReading.content.substring(0, 35)}..."
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              {speechState === 'paused' ? (
                <button 
                  type="button" 
                  className="glass-button" 
                  style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: 'var(--primary)' }}
                  onClick={handleResumeSpeech}
                >
                  ▶️ Resume
                </button>
              ) : (
                <button 
                  type="button" 
                  className="glass-button" 
                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  onClick={handlePauseSpeech}
                  disabled={speechState !== 'playing'}
                >
                  ⏸️ Pause
                </button>
              )}
              <button 
                type="button" 
                className="glass-button" 
                style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444' }}
                onClick={handleStopSpeech}
              >
                ⏹️ Stop
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          
          {/* Attachment button */}
          <button
            type="button"
            onClick={() => setShowAttachmentDrawer(!showAttachmentDrawer)}
            className="glass-button"
            style={{ padding: '12px', borderRadius: 'var(--border-radius-sm)' }}
            title="Attach files"
          >
            <Paperclip size={18} />
          </button>

          {/* Voice Input Button */}
          {voiceInputSupported && voiceInputEnabled && (
            <button
              type="button"
              onClick={handleMicrophoneClick}
              className={`glass-button ${isListening ? 'level-up-flash' : ''}`}
              style={{ 
                padding: '12px', 
                borderRadius: 'var(--border-radius-sm)',
                background: isListening ? 'var(--secondary)' : 'rgba(255,255,255,0.03)',
                color: isListening ? 'white' : 'var(--text-main)',
                border: isListening ? '1px solid var(--secondary)' : '1px solid var(--card-border)',
              }}
              title={isListening ? "Listening... click to stop" : "Start speaking"}
            >
              <Mic size={18} />
            </button>
          )}

          {/* Text Input */}
          <input
            type="text"
            placeholder={isListening ? "Listening to voice..." : `Message ${getCompanionName()}...`}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="glass-input"
            style={{ flexGrow: 1, padding: '14px 18px', borderRadius: 'var(--border-radius-sm)' }}
            disabled={isListening}
            required
          />

          {/* Emoji Trigger button */}
          <button
            type="button"
            onClick={() => setShowInputEmojiPicker(!showInputEmojiPicker)}
            className="glass-button"
            style={{ padding: '12px', borderRadius: 'var(--border-radius-sm)' }}
            title="Insert emojis"
          >
            <Smile size={18} />
          </button>

          {/* Send Button */}
          <button
            type="submit"
            className="glass-button glass-button-primary"
            style={{ padding: '14px', borderRadius: 'var(--border-radius-sm)' }}
            disabled={aiTyping || isListening || !newMessage.trim()}
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* 4. VOICE CALL SIMULATION MODAL OVERLAY */}
      {showVoiceCallModal && activeCharacter && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(18, 18, 18, 0.95)',
          zIndex: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }} className="animate-fade-in">
          
          <div className="glass-card level-up-flash" style={{
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            padding: '40px 30px',
            border: '1.5px solid var(--primary)',
            background: 'var(--card-bg)',
            boxShadow: '0 0 50px var(--primary-glow)'
          }}>
            {/* Character Avatar with floating heart icons in background */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'rgba(255, 79, 129, 0.08)',
                border: '3.5px solid var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '4.5rem',
                boxShadow: '0 0 30px var(--primary-glow)',
                animation: 'bounce 2.5s infinite'
              }}>
                {activeCharacter.avatar}
              </div>
              <span style={{ position: 'absolute', top: '-10px', right: '-15px', fontSize: '1.5rem', opacity: 0.8 }} className="floating-heart">💖</span>
            </div>

            {/* Calling Details */}
            <div>
              <h3 style={{ fontSize: '1.6rem', fontFamily: 'Outfit, sans-serif' }}>{getCompanionName()}</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>{activeCharacter.personality} Partner</span>
              
              {/* Call Timer duration display */}
              <p style={{ 
                fontSize: '1.2rem', 
                fontFamily: 'monospace', 
                color: 'var(--text-main)', 
                marginTop: '12px',
                fontWeight: 'bold' 
              }}>
                {formatCallTime(callDuration)}
              </p>
            </div>

            {/* Audio Wave Visualizer animation */}
            <div style={{
              display: 'flex',
              gap: '6px',
              height: '40px',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '10px 0'
            }}>
              <div className="wave-bar" />
              <div className="wave-bar" />
              <div className="wave-bar" />
              <div className="wave-bar" />
              <div className="wave-bar" />
            </div>

            {/* Call Action controls Mute, End Call, Speaker */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginTop: '10px' }}>
              
              {/* Mute toggle */}
              <button
                onClick={() => setIsCallMuted(!isCallMuted)}
                className="glass-button"
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isCallMuted ? '#ef4444' : 'rgba(255,255,255,0.05)',
                  border: isCallMuted ? '1px solid #ef4444' : '1px solid var(--card-border)',
                  color: isCallMuted ? 'white' : 'var(--text-main)'
                }}
                title={isCallMuted ? "Unmute Mic" : "Mute Mic"}
              >
                <MicOff size={20} />
              </button>

              {/* End Call Button */}
              <button
                onClick={() => setShowVoiceCallModal(false)}
                className="glass-button"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#ef4444',
                  border: '1px solid #ef4444',
                  color: 'white',
                  boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)'
                }}
                title="Hang up"
              >
                <PhoneOff size={28} />
              </button>

              {/* Speaker toggle */}
              <button
                onClick={() => setIsSpeakerActive(!isSpeakerActive)}
                className="glass-button"
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isSpeakerActive ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  border: isSpeakerActive ? '1px solid var(--primary)' : '1px solid var(--card-border)',
                  color: isSpeakerActive ? 'var(--text-inverse)' : 'var(--text-main)'
                }}
                title={isSpeakerActive ? "Disable Speaker" : "Enable Speaker"}
              >
                <Volume2 size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. LEVEL UP CELEBRATION MODAL */}
      {showLevelUpModal && levelUpData && (
        <div className="celebration-overlay">
          {/* Confetti pieces */}
          {[...Array(20)].map((_, i) => {
            const left = Math.random() * 100;
            const delay = Math.random() * 4;
            const color = ['#ff4f81', '#8b5cf6', '#ffd6a5', '#10b981', '#3b82f6'][i % 5];
            return (
              <div 
                key={`confetti-${i}`} 
                className="confetti-piece"
                style={{ 
                  left: `${left}%`, 
                  animationDelay: `${delay}s`,
                  background: color,
                  width: `${Math.random() * 6 + 6}px`,
                  height: `${Math.random() * 12 + 12}px`
                }} 
              />
            );
          })}
          
          {/* Floating hearts */}
          {[...Array(10)].map((_, i) => {
            const left = Math.random() * 100;
            const delay = Math.random() * 3;
            const size = Math.random() * 1.5 + 1;
            return (
              <div 
                key={`heart-${i}`} 
                className="celebration-heart"
                style={{ 
                  left: `${left}%`, 
                  animationDelay: `${delay}s`,
                  fontSize: `${size}rem`
                }}
              >
                {['💖', '❤️', '💕', '🥰'][i % 4]}
              </div>
            );
          })}

          <div className="glass-card level-up-flash" style={{
            maxWidth: '450px',
            width: '100%',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            padding: '40px 30px',
            border: '2px solid var(--primary)',
            position: 'relative',
            zIndex: 4010
          }}>
            <div style={{
              background: 'rgba(255, 79, 129, 0.08)',
              border: '1px solid var(--primary)',
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              animation: 'bounce 1.5s infinite'
            }}>
              <Heart size={36} fill="var(--primary)" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.1em', fontFamily: 'Outfit' }}>
                LEVEL UP CELEBRATION!
              </span>
              <h3 style={{ fontSize: '1.8rem', fontFamily: 'Outfit, sans-serif' }}>
                Relationship Evolved!
              </h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                You and <strong>{levelUpData.companion}</strong> have gotten closer. Your connection has transitioned to the next tier:
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--card-border)',
              padding: '12px 24px',
              borderRadius: '16px',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--secondary)'
            }}>
              💖 Level {levelUpData.level} - {levelUpData.levelName}
            </div>

            <button 
              onClick={() => setShowLevelUpModal(false)} 
              className="glass-button glass-button-primary"
              style={{ width: '180px', marginTop: '10px' }}
            >
              Continue Chat 💖
            </button>
          </div>
        </div>
      )}

      {/* 6. FLOATING CONTEXT MENU */}
      {contextMenu && (
        <div 
          className="custom-context-menu" 
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
        >
          {/* Reaction Emoji Row at the top of Context Menu */}
          <div className="context-menu-reactions" style={{
            display: 'flex',
            gap: '8px',
            padding: '8px 12px',
            borderBottom: '1px solid var(--card-border)',
            justifyContent: 'space-around'
          }}>
            {['❤️', '🥰', '😂', '😢', '👍', '🔥'].map(emoji => (
              <span 
                key={emoji}
                className="context-emoji-option"
                style={{ cursor: 'pointer', fontSize: '1.25rem' }}
                onClick={() => {
                  handleToggleReaction(contextMenu.message.id, emoji);
                  setContextMenu(null);
                }}
              >
                {emoji}
              </span>
            ))}
          </div>

          {localStorage.getItem('pookie-read-aloud-available') !== 'false' && (
            <button 
              className="context-menu-item"
              onClick={() => {
                startReadAloud(contextMenu.message);
                setContextMenu(null);
              }}
            >
              🔊 Read Aloud
            </button>
          )}
          <button 
            className="context-menu-item"
            onClick={() => {
              navigator.clipboard.writeText(contextMenu.message.content);
              setContextMenu(null);
            }}
          >
            📋 Copy Message
          </button>
          <button 
            className="context-menu-item"
            onClick={() => {
              handleDeleteMessage(contextMenu.message.id);
              setContextMenu(null);
            }}
          >
            🗑️ Delete Message
          </button>
          <button 
            className="context-menu-item"
            onClick={() => {
              handleShareMessage(contextMenu.message);
              setContextMenu(null);
            }}
          >
            🔗 Share Message
          </button>
        </div>
      )}

      {/* Heart Burst Screen Overlay */}
      {showHeartBurst && (
        <div className="heart-burst-overlay">
          {[...Array(16)].map((_, idx) => {
            const spreadX = (idx % 2 === 0 ? 1 : -1) * (10 + Math.random() * 120);
            return (
              <span 
                key={idx} 
                className="burst-heart" 
                style={{
                  left: '50%',
                  bottom: '20%',
                  '--spread-x': `${spreadX}px`,
                  animationDelay: `${Math.random() * 0.25}s`,
                  fontSize: `${1.2 + Math.random() * 1.8}rem`
                }}
              >
                ❤️
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Chat;
