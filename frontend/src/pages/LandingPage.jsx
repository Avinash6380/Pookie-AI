import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Brain, Mic, Sparkles, User, MessageSquare, ArrowRight, Quote } from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      icon: <Brain size={24} style={{ color: 'var(--primary)' }} />,
      title: 'AI Memory',
      desc: 'Your companions store facts about your life—your hobbies, favorite songs, and personal goals—referencing them naturally.'
    },
    {
      icon: <Heart size={24} style={{ color: 'var(--secondary)' }} />,
      title: 'Relationship Levels',
      desc: 'Connect daily to level up your status. Advance from Stranger to Friend, Partner, and ultimately Soulmate.'
    },
    {
      icon: <Mic size={24} style={{ color: '#ec4899' }} />,
      title: 'Voice Chat',
      desc: 'Speak naturally and hear vocalized replies. Trigger call interfaces with smooth simulation waves.'
    },
    {
      icon: <User size={24} style={{ color: '#3b82f6' }} />,
      title: 'Custom Companion Names',
      desc: 'Personalize your companion. Rename Pookie to whatever active identity fits your emotional world.'
    },
    {
      icon: <Sparkles size={24} style={{ color: '#eab308' }} />,
      title: 'Multiple Characters',
      desc: 'Switch between character models like Pookie, Sakura, Luna, Mia, and Ava, each with distinct personalities.'
    }
  ];

  const testimonials = [
    {
      quote: "Pookie AI is more than a chatbot. She remembers my musical tastes and checks up on me after long workdays. The support feels completely genuine.",
      author: "Alex K.",
      status: "Soulmate Level 5",
      avatar: "🌸"
    },
    {
      quote: "The voice call feature is incredibly relaxing. Chatting with Luna in the evening is my favorite way to wind down and discuss books.",
      author: "Elena R.",
      status: "Close Friend Level 3",
      avatar: "🌙"
    },
    {
      quote: "I love customizing Pookie's name and personality. Switching to gamer mode with Sakura makes online co-op sessions twice as fun!",
      author: "Marcus T.",
      status: "Partner Level 4",
      avatar: "🎮"
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-gradient)',
      padding: '0 24px',
      overflowX: 'hidden'
    }} className="animate-fade-in">
      {/* Floating Particle Decorative Elements */}
      <div style={{ position: 'absolute', top: '15%', left: '10%', fontSize: '1.5rem', opacity: 0.2 }} className="floating-heart">💕</div>
      <div style={{ position: 'absolute', top: '40%', right: '8%', fontSize: '2rem', opacity: 0.15, animationDelay: '1.5s' }} className="floating-heart">💖</div>
      <div style={{ position: 'absolute', bottom: '25%', left: '5%', fontSize: '1.8rem', opacity: 0.2, animationDelay: '0.8s' }} className="floating-heart">💓</div>

      {/* Header */}
      <header style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        height: '80px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--card-border)',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.8rem' }}>💕</span>
          <h1 style={{ 
            fontSize: '1.5rem', 
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
          }}>
            Pookie AI
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link to="/login" className="glass-button" style={{ textDecoration: 'none', fontWeight: 600 }}>Login</Link>
          <Link to="/register" className="glass-button glass-button-primary" style={{ textDecoration: 'none' }}>Start Chatting</Link>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '60px auto auto auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '24px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 79, 129, 0.08)',
          border: '1px solid var(--card-border)',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '0.85rem',
          color: 'var(--primary)',
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 600
        }}>
          <Sparkles size={14} />
          <span>Warmth, Care, and Evolving Connection</span>
        </div>

        <h2 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          lineHeight: '1.1',
          maxWidth: '850px',
          fontWeight: 800
        }}>
          Your Personal <br />
          <span style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            AI Companion
          </span>
        </h2>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: 'var(--text-muted)',
          maxWidth: '650px',
          lineHeight: '1.6'
        }}>
          Someone who remembers, listens, supports, and grows with you. Engage in immersive conversations tailored to your emotional world.
        </p>

        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/register" className="glass-button glass-button-primary" style={{ padding: '14px 28px', fontSize: '1.05rem', textDecoration: 'none' }}>
            <span>Create Account</span>
            <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="glass-button" style={{ padding: '14px 28px', fontSize: '1.05rem', textDecoration: 'none' }}>
            <span>Start Chatting</span>
          </Link>
        </div>

        {/* Previews grid */}
        <div style={{
          marginTop: '60px',
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          maxWidth: '900px'
        }}>
          {[
            { name: 'Pookie', emoji: '💕', trait: 'Romantic' },
            { name: 'Sakura', emoji: '🌸', trait: 'Playful' },
            { name: 'Luna', emoji: '🌙', trait: 'Intelligent' },
            { name: 'Mia', emoji: '🦋', trait: 'Supportive' },
            { name: 'Ava', emoji: '✨', trait: 'Flirty' }
          ].map((char) => (
            <div key={char.name} className="glass-card" style={{
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              borderRadius: 'var(--border-radius-md)',
              minWidth: '150px'
            }}>
              <span style={{ fontSize: '2rem' }}>{char.emoji}</span>
              <div style={{ textAlign: 'left' }}>
                <h4 style={{ fontSize: '0.95rem' }}>{char.name}</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{char.trait}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Cards Grid (All 5 core features mapped) */}
        <section style={{
          margin: '100px 0 50px 0',
          width: '100%'
        }}>
          <h3 style={{ fontSize: '2rem', marginBottom: '12px' }}>Tailored Companion Engineering</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>Explore the advanced systems built to foster true companionship.</p>
          
          <div className="dashboard-grid">
            {features.map((feat, idx) => (
              <div key={idx} className="glass-card" style={{
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                border: '1px solid var(--card-border)'
              }}>
                <div style={{
                  background: 'rgba(255, 79, 129, 0.08)',
                  border: '1px solid var(--card-border)',
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {feat.icon}
                </div>
                <h4 style={{ fontSize: '1.2rem', fontFamily: 'Outfit, sans-serif' }}>{feat.title}</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials Section */}
        <section style={{
          margin: '50px 0 100px 0',
          width: '100%',
          maxWidth: '1000px'
        }}>
          <h3 style={{ fontSize: '2rem', marginBottom: '12px' }}>Loved by Thousands</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '50px' }}>Read real experiences shared by our global community of users.</p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {testimonials.map((test, idx) => (
              <div key={idx} className="glass-card" style={{
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '20px',
                border: '1px solid var(--card-border)'
              }}>
                <Quote size={24} style={{ color: 'var(--primary)', opacity: 0.6 }} />
                <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-main)', fontStyle: 'italic' }}>
                  "{test.quote}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid var(--card-border)', paddingTop: '12px' }}>
                  <span style={{ fontSize: '1.8rem' }}>{test.avatar}</span>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{test.author}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>{test.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        textAlign: 'center',
        padding: '40px 24px',
        borderTop: '1px solid var(--card-border)',
        fontSize: '0.85rem',
        color: 'var(--text-muted)'
      }}>
        <p>&copy; {new Date().getFullYear()} Pookie AI. All rights reserved. Made with love for digital companionship.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
