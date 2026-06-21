'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  playHoverSound,
  playClickSound,
  playSuccessSound,
  playPortalSound
} from '@/lib/audio';
import { 
  ArrowUp, 
  MessageSquare, 
  Search, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ChevronRight,
  TrendingUp,
  Clock,
  Map,
  Megaphone,
  ChevronDown
} from 'lucide-react';

const CATEGORIES = ['Feature Request', 'Bug Report', 'General Feedback', 'Account Issue'];

const CATEGORY_COLORS = {
  'Bug Report':       { bg: 'rgba(168, 36, 36, 0.08)',  border: 'rgba(168, 36, 36, 0.25)',  text: '#FFA494' },
  'Feature Request':  { bg: 'rgba(212, 175, 55, 0.08)', border: 'rgba(212, 175, 55, 0.25)', text: 'var(--gold-bright)' },
  'General Feedback': { bg: 'rgba(56, 189, 248, 0.08)', border: 'rgba(56, 189, 248, 0.25)', text: '#7DD3FC' },
  'Account Issue':    { bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.25)', text: '#34D399' }
};

const STATUS_META = {
  open:        { label: 'Under Review', bg: 'rgba(212,175,55,0.06)', border: 'rgba(212,175,55,0.2)', text: 'var(--gold-dim)' },
  in_progress: { label: 'In Progress',  bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.25)', text: '#FB923C' },
  resolved:    { label: 'Completed',    bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.25)', text: '#34D399' }
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  
  return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function FeedbackClient({ user }) {
  const router = useRouter();
  
  // App navigation state
  const [activeTab, setActiveTab] = useState('feedback'); // 'feedback' | 'roadmap' | 'changelog'
  
  // Feedback items and loading state
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Upvoted feedback IDs on this device
  const [upvotedIds, setUpvotedIds] = useState([]);
  
  // Search, category filter and sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('top'); // 'top' | 'new'

  // Submission Form State
  const [formCategory, setFormCategory] = useState('Feature Request');
  const [formSubject, setFormSubject] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  
  // Expand message states
  const [expandedIds, setExpandedIds] = useState({});

  // Theme settings
  const [theme, setTheme] = useState('obsidian');
  const [brightness, setBrightness] = useState('dark');

  // Initialize theme from localStorage and load tickets
  useEffect(() => {
    const savedTheme = localStorage.getItem('tjesa_theme') || 'obsidian';
    const savedBrightness = localStorage.getItem('tjesa_brightness') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    document.body.setAttribute('data-brightness', savedBrightness);
    setTheme(savedTheme);
    setBrightness(savedBrightness);

    // Load upvoted IDs from localStorage
    try {
      const stored = localStorage.getItem('tjesa_upvoted_ids');
      if (stored) {
        setUpvotedIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error('[FeedbackClient] Error parsing upvoted IDs:', e);
    }
  }, []);

  // Fetch feedback submissions
  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/feedback');
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      } else {
        setError('Failed to fetch the scroll of feedback. Please refresh.');
      }
    } catch (err) {
      setError('Connection failure while loading feedback records.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Upvote / Retract handler
  const handleVote = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isUpvoted = upvotedIds.includes(id);
    const voteVal = isUpvoted ? -1 : 1;
    
    // Play sound chimes
    playClickSound();

    // Optimistically update client votes count and upvoted list
    let nextUpvoted = [...upvotedIds];
    if (isUpvoted) {
      nextUpvoted = nextUpvoted.filter(vid => vid !== id);
    } else {
      nextUpvoted.push(id);
    }
    setUpvotedIds(nextUpvoted);
    localStorage.setItem('tjesa_upvoted_ids', JSON.stringify(nextUpvoted));

    setSubmissions(prev => 
      prev.map(sub => 
        sub.id === id 
          ? { ...sub, votes: Math.max(0, (sub.votes || 0) + voteVal) }
          : sub
      )
    );

    try {
      const res = await fetch('/api/feedback/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, value: voteVal }),
      });
      if (!res.ok) {
        // Rollback on server failure
        throw new Error('Vote save failed');
      }
    } catch (err) {
      console.error('[FeedbackClient] Upvote failed, rolling back:', err);
      // Revert optimistic update
      if (isUpvoted) {
        nextUpvoted.push(id);
      } else {
        nextUpvoted = nextUpvoted.filter(vid => vid !== id);
      }
      setUpvotedIds(nextUpvoted);
      localStorage.setItem('tjesa_upvoted_ids', JSON.stringify(nextUpvoted));
      setSubmissions(prev => 
        prev.map(sub => 
          sub.id === id 
            ? { ...sub, votes: Math.max(0, (sub.votes || 0) - voteVal) }
            : sub
        )
      );
    }
  };

  // Submit Feedback Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formSubject.trim() || !formMessage.trim()) {
      setFormError('Subject and message are required.');
      return;
    }
    if (formMessage.trim().length < 10) {
      setFormError('Please detail your idea further (at least 10 characters).');
      return;
    }
    if (!user && (!formEmail || !formEmail.includes('@'))) {
      setFormError('A valid email is required to submit feedback as guest.');
      return;
    }

    setFormSubmitting(true);
    setFormError('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: formCategory,
          subject: formSubject,
          message: formMessage,
          email: user ? user.email : formEmail
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        playSuccessSound();
        setFormSuccess(true);
        setFormSubject('');
        setFormMessage('');
        setFormEmail('');
        
        // Add to submissions array in state
        const newTicket = {
          ...data.entry,
          votes: 1,
          user_email: user ? user.email : (formEmail.slice(0, 2) + '***' + formEmail.slice(formEmail.indexOf('@') - 1))
        };
        setSubmissions(prev => [newTicket, ...prev]);

        // Auto upvote their own post in localStorage
        const nextUpvoted = [...upvotedIds, data.entry.id];
        setUpvotedIds(nextUpvoted);
        localStorage.setItem('tjesa_upvoted_ids', JSON.stringify(nextUpvoted));
      } else {
        setFormError(data.error || 'Submission failed. Please check fields and try again.');
      }
    } catch {
      setFormError('Network issue. Failed to send your request.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Filtering & Sorting Submissions
  const filteredSubmissions = submissions.filter(item => {
    const matchesSearch = 
      item.subject?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.message?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    if (sortBy === 'top') {
      return (b.votes || 0) - (a.votes || 0);
    } else {
      return new Date(b.submitted_at) - new Date(a.submitted_at);
    }
  });

  // Roadmap columns filtering
  const roadmapUnderReview = submissions.filter(s => s.status === 'open');
  const roadmapInProgress = submissions.filter(s => s.status === 'in_progress');
  const roadmapCompleted = submissions.filter(s => s.status === 'resolved');

  // Changelog filtering (resolved items)
  const changelogSubmissions = submissions.filter(s => s.status === 'resolved');

  const toggleExpand = (id) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      <style>{`
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .feedback-portal-card {
          background: var(--obsidian-card);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: var(--border-gold);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          animation: fadeInSlideUp 0.35s ease both;
        }
        .feedback-nav-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 8px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--sand-dim);
          font-family: var(--font-headings);
          font-size: 13px;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: all 0.25s ease;
          text-transform: uppercase;
        }
        .feedback-nav-btn:hover {
          background: rgba(212,175,55,0.05);
          color: var(--sand-light);
        }
        .feedback-nav-btn.active {
          background: rgba(212,175,55,0.08);
          border-color: rgba(212,175,55,0.25);
          color: var(--gold-bright);
          box-shadow: 0 0 15px rgba(212,175,55,0.05);
        }
        .feedback-nav-btn.active svg {
          filter: drop-shadow(0 0 4px var(--gold-glow));
        }
        .upvote-container-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 52px;
          height: 52px;
          border-radius: 8px;
          border: 1px solid rgba(212, 175, 55, 0.15);
          background: rgba(0, 0, 0, 0.25);
          color: var(--sand-dim);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .upvote-container-btn:hover {
          border-color: var(--gold);
          background: rgba(212, 175, 55, 0.05);
          color: var(--gold-bright);
          transform: translateY(-1px);
        }
        .upvote-container-btn.voted {
          background: var(--gold-gradient);
          border-color: var(--gold);
          color: var(--obsidian) !important;
          box-shadow: 0 0 15px var(--gold-glow);
        }
        .upvote-container-btn.voted svg {
          stroke: var(--obsidian);
        }
        .upvote-container-btn.voted span {
          color: var(--obsidian) !important;
        }
        .filter-pill-btn {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-family: var(--font-headings);
          letter-spacing: 0.04em;
          cursor: pointer;
          border: 1px solid rgba(212,175,55,0.1);
          background: transparent;
          color: var(--sand-dim);
          transition: all 0.2s ease;
        }
        .filter-pill-btn:hover {
          border-color: rgba(212,175,55,0.3);
          color: var(--sand-light);
        }
        .filter-pill-btn.active {
          border-color: rgba(212,175,55,0.5);
          background: rgba(212,175,55,0.08);
          color: var(--gold-bright);
        }
        .roadmap-column {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: rgba(13, 13, 11, 0.4);
          border: 1px solid rgba(212, 175, 55, 0.08);
          border-radius: 12px;
          padding: 16px;
          flex: 1;
          min-width: 280px;
        }
        .roadmap-card {
          background: rgba(20, 19, 17, 0.85);
          border: 1px solid rgba(212, 175, 55, 0.12);
          border-radius: 10px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: all 0.2s ease;
        }
        .roadmap-card:hover {
          border-color: rgba(212, 175, 55, 0.35);
          box-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 10px var(--gold-glow);
          transform: translateY(-2px);
        }
        .changelog-timeline-item {
          position: relative;
          padding-left: 28px;
          border-left: 2px solid rgba(212, 175, 55, 0.15);
          padding-bottom: 32px;
        }
        .changelog-timeline-item:last-child {
          border-left-color: transparent;
          padding-bottom: 0;
        }
        .changelog-timeline-dot {
          position: absolute;
          left: -7px;
          top: 4px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--gold-gradient);
          border: 2px solid var(--obsidian);
          box-shadow: 0 0 8px var(--gold);
        }
      `}</style>

      {/* Main portal wrapper */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px 24px',
        width: '100%',
        zIndex: 1,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        
        {/* Portal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
          paddingBottom: '20px'
        }}>
          {/* Logo & Portal title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }} onMouseEnter={playHoverSound} onClick={playClickSound}>
              <svg width="36" height="36" viewBox="0 0 52 52" fill="none" style={{ filter: 'drop-shadow(0 0 8px var(--gold-glow))' }}>
                <rect x="4" y="4" width="20" height="20" rx="3" fill="none" stroke="var(--gold)" strokeWidth="1.5" />
                <rect x="28" y="4" width="20" height="20" rx="3" fill="none" stroke="var(--gold)" strokeWidth="1.5" />
                <rect x="4" y="28" width="20" height="20" rx="3" fill="none" stroke="var(--gold-dim)" strokeWidth="1.5" />
                <rect x="28" y="28" width="20" height="20" rx="3" fill="none" stroke="var(--gold-dim)" strokeWidth="1.5" />
                <path d="M24 14 L28 14 M24 38 L28 38 M14 24 L14 28 M38 24 L38 28" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" />
                <circle cx="26" cy="26" r="3" fill="var(--gold)" />
                <circle cx="26" cy="26" r="1.5" fill="var(--obsidian-mid)" />
              </svg>
            </Link>
            <div>
              <h1 style={{ fontSize: '22px', margin: 0, letterSpacing: '0.12em', fontFamily: 'var(--font-headings)' }}>
                Tjesa Portal
              </h1>
              <span style={{ fontSize: '10px', letterSpacing: '0.22em', color: 'var(--sand-dim)', textTransform: 'uppercase' }}>
                Feedback & Roadmap Chamber
              </span>
            </div>
          </div>

          {/* Centered navigation tabs */}
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.12)', borderRadius: '10px', padding: '4px' }}>
            <button
              className={`feedback-nav-btn${activeTab === 'feedback' ? ' active' : ''}`}
              onClick={() => { playPortalSound(); setActiveTab('feedback'); }}
              onMouseEnter={playHoverSound}
            >
              <MessageSquare size={14} />
              Feedback
            </button>
            <button
              className={`feedback-nav-btn${activeTab === 'roadmap' ? ' active' : ''}`}
              onClick={() => { playPortalSound(); setActiveTab('roadmap'); }}
              onMouseEnter={playHoverSound}
            >
              <Map size={14} />
              Roadmap
            </button>
            <button
              className={`feedback-nav-btn${activeTab === 'changelog' ? ' active' : ''}`}
              onClick={() => { playPortalSound(); setActiveTab('changelog'); }}
              onMouseEnter={playHoverSound}
            >
              <Megaphone size={14} />
              Changelog
            </button>
          </div>

          {/* Auth Button link */}
          <div>
            {user ? (
              <Link href="/dashboard" className="kemet-btn-secondary" style={{ padding: '8px 18px', fontSize: '11px' }} onMouseEnter={playHoverSound} onClick={playClickSound}>
                Back to Dashboard
              </Link>
            ) : (
              <Link href="/login" className="kemet-btn" style={{ padding: '8px 18px', fontSize: '11px' }} onMouseEnter={playHoverSound} onClick={playClickSound}>
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Dynamic content wrapper based on activeTab */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ════════════════════ FEEDBACK TAB ════════════════════ */}
          {activeTab === 'feedback' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '28px', alignItems: 'flex-start' }} className="grid-cols-2">
              
              {/* Left Column: Form to share idea */}
              <div className="feedback-portal-card" style={{ padding: '24px', position: 'sticky', top: '24px' }}>
                <div style={{ borderBottom: '1px solid rgba(212,175,55,0.08)', paddingBottom: '14px', marginBottom: '18px' }}>
                  <h3 style={{ fontSize: '15px', textTransform: 'uppercase', color: 'var(--gold)', margin: '0 0 4px' }}>
                    Share Your Idea
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--sand-dim)', margin: 0 }}>
                    What would make the Tjesa experience absolute perfection? Let us know!
                  </p>
                </div>

                {formSuccess ? (
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', justifyCenter: 'center', margin: '0 auto 14px', alignContent: 'center', justifyContent: 'center' }}>
                      <CheckCircle2 size={22} color="#34D399" style={{ alignSelf: 'center' }} />
                    </div>
                    <h4 style={{ fontSize: '14px', color: '#34D399', letterSpacing: '0.05em', margin: '0 0 6px', textTransform: 'uppercase' }}>
                      Scroll Recorded
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--sand-dim)', lineHeight: 1.6, margin: '0 0 18px' }}>
                      Thank you! Your idea has been logged. It will show on the board immediately and other scribes can upvote it.
                    </p>
                    <button
                      onClick={() => setFormSuccess(false)}
                      className="kemet-btn-secondary"
                      style={{ padding: '6px 16px', fontSize: '11px', height: 'auto', minHeight: 'unset' }}
                      onMouseEnter={playHoverSound}
                      onClick={playClickSound}
                    >
                      Share Another
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* Category Selection */}
                    <div>
                      <label className="kemet-label" style={{ fontSize: '11px', marginBottom: '6px' }}>Category</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        {CATEGORIES.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => { playClickSound(); setFormCategory(cat); }}
                            style={{
                              padding: '8px 4px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              border: formCategory === cat ? '1px solid var(--gold)' : '1px solid rgba(212,175,55,0.12)',
                              background: formCategory === cat ? 'rgba(212,175,55,0.1)' : 'transparent',
                              color: formCategory === cat ? 'var(--gold-bright)' : 'var(--sand-dim)',
                              fontFamily: 'var(--font-headings)',
                              letterSpacing: '0.04em',
                              transition: 'all 0.2s ease',
                              textAlign: 'center',
                            }}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="kemet-label" htmlFor="portal-subject" style={{ fontSize: '11px', marginBottom: '6px' }}>Subject</label>
                      <input
                        id="portal-subject"
                        type="text"
                        required
                        className="kemet-input"
                        placeholder="Brief summary of your idea…"
                        value={formSubject}
                        onChange={e => setFormSubject(e.target.value)}
                        style={{ padding: '10px 12px', fontSize: '14px', background: 'rgba(0,0,0,0.2)' }}
                      />
                    </div>

                    {/* Message / Details */}
                    <div>
                      <label className="kemet-label" htmlFor="portal-message" style={{ fontSize: '11px', marginBottom: '6px' }}>Message Details</label>
                      <textarea
                        id="portal-message"
                        required
                        className="kemet-input"
                        placeholder="Detail your request. What problem are we solving? how does it work?..."
                        rows={5}
                        value={formMessage}
                        onChange={e => setFormMessage(e.target.value)}
                        style={{ padding: '10px 12px', fontSize: '13px', background: 'rgba(0,0,0,0.2)', resize: 'vertical', minHeight: '100px' }}
                      />
                    </div>

                    {/* Guest Email Field (if not logged in) */}
                    {!user && (
                      <div>
                        <label className="kemet-label" htmlFor="portal-email" style={{ fontSize: '11px', marginBottom: '6px' }}>Your Email</label>
                        <input
                          id="portal-email"
                          type="email"
                          required
                          className="kemet-input"
                          placeholder="To notify you of updates…"
                          value={formEmail}
                          onChange={e => setFormEmail(e.target.value)}
                          style={{ padding: '10px 12px', fontSize: '14px', background: 'rgba(0,0,0,0.2)' }}
                        />
                      </div>
                    )}

                    {/* Error Notification */}
                    {formError && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FF7F7F', fontSize: '12px', background: 'rgba(168,36,36,0.1)', border: '1px solid rgba(168,36,36,0.25)', padding: '10px 12px', borderRadius: '6px' }}>
                        <AlertCircle size={14} style={{ flexShrink: 0 }} />
                        <span>{formError}</span>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={formSubmitting}
                      className="kemet-btn"
                      style={{ padding: '10px 20px', fontSize: '12px', width: '100%', justifyContent: 'center' }}
                      onMouseEnter={playHoverSound}
                      onClick={playClickSound}
                    >
                      {formSubmitting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Logging scroll…
                        </>
                      ) : (
                        <>
                          <PlusCircle size={14} />
                          Submit Idea
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* Right Column: Search + Filters + Post List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Search, Sort and Category Filters Panel */}
                <div className="feedback-portal-card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    
                    {/* Search Field */}
                    <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--sand-dark)' }}>
                        <Search size={16} />
                      </span>
                      <input
                        type="text"
                        placeholder="Search for requested ideas..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="kemet-input"
                        style={{ padding: '10px 12px 10px 38px', fontSize: '14px', background: 'rgba(0,0,0,0.2)' }}
                      />
                    </div>

                    {/* Sort buttons: Trending vs Recent */}
                    <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(212,175,55,0.08)', borderRadius: '8px', padding: '3px' }}>
                      <button
                        onClick={() => { playClickSound(); setSortBy('top'); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '6px 12px', border: 'none', cursor: 'pointer', borderRadius: '6px',
                          fontSize: '11px', fontFamily: 'var(--font-headings)', letterSpacing: '0.04em',
                          background: sortBy === 'top' ? 'var(--gold-gradient)' : 'transparent',
                          color: sortBy === 'top' ? '#0D0D0B' : 'var(--sand-dim)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <TrendingUp size={12} />
                        Top Upvoted
                      </button>
                      <button
                        onClick={() => { playClickSound(); setSortBy('new'); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '6px 12px', border: 'none', cursor: 'pointer', borderRadius: '6px',
                          fontSize: '11px', fontFamily: 'var(--font-headings)', letterSpacing: '0.04em',
                          background: sortBy === 'new' ? 'var(--gold-gradient)' : 'transparent',
                          color: sortBy === 'new' ? '#0D0D0B' : 'var(--sand-dim)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Clock size={12} />
                        Recent
                      </button>
                    </div>
                  </div>

                  {/* Category Filter Badges */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px', borderTop: '1px solid rgba(212,175,55,0.05)', paddingTop: '10px' }}>
                    <button
                      className={`filter-pill-btn${categoryFilter === 'All' ? ' active' : ''}`}
                      onClick={() => { playClickSound(); setCategoryFilter('All'); }}
                    >
                      All Categories
                    </button>
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        className={`filter-pill-btn${categoryFilter === cat ? ' active' : ''}`}
                        onClick={() => { playClickSound(); setCategoryFilter(cat); }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submissions List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {loading ? (
                    <div className="feedback-portal-card" style={{ padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyCenter: 'center', gap: '14px' }}>
                      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--gold)' }} />
                      <span style={{ fontSize: '13px', color: 'var(--sand-dim)', fontFamily: 'var(--font-headings)', letterSpacing: '0.08em' }}>
                        Loading feedback archive scrolls...
                      </span>
                    </div>
                  ) : error ? (
                    <div className="feedback-portal-card" style={{ padding: '32px', textAlign: 'center', border: '1px solid var(--scarab-red)' }}>
                      <AlertCircle size={32} color="#EF4444" style={{ margin: '0 auto 12px' }} />
                      <p style={{ fontSize: '14px', color: '#FFA494', margin: 0 }}>{error}</p>
                    </div>
                  ) : sortedSubmissions.length === 0 ? (
                    <div className="feedback-portal-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
                      <MessageSquare size={32} style={{ color: 'var(--sand-dark)', margin: '0 auto 12px' }} />
                      <p style={{ fontSize: '14px', color: 'var(--sand-dim)', margin: '0 0 6px' }}>
                        No scrolls match your query.
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--sand-dark)', margin: 0 }}>
                        Be the first to submit a new idea using the form on the left!
                      </p>
                    </div>
                  ) : (
                    sortedSubmissions.map((item) => {
                      const isVoted = upvotedIds.includes(item.id);
                      const catCol = CATEGORY_COLORS[item.category] || { bg: 'rgba(212,175,55,0.06)', border: 'rgba(212,175,55,0.12)', text: 'var(--gold-dim)' };
                      const statusMeta = STATUS_META[item.status] || STATUS_META.open;
                      const isExpanded = !!expandedIds[item.id];
                      
                      return (
                        <div
                          key={item.id}
                          className="feedback-portal-card"
                          style={{
                            padding: '16px 20px',
                            display: 'flex',
                            gap: '16px',
                            alignItems: 'flex-start',
                            borderLeft: isVoted ? '3px solid var(--gold)' : '1px solid rgba(212, 175, 55, 0.2)',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {/* Left: Vote Button Box */}
                          <button
                            className={`upvote-container-btn${isVoted ? ' voted' : ''}`}
                            onClick={(e) => handleVote(e, item.id)}
                            title={isVoted ? "Remove upvote" : "Upvote feature"}
                          >
                            <ArrowUp size={16} strokeWidth={2.5} style={{ marginBottom: '2px', transition: 'transform 0.2s ease' }} className="vote-arrow" />
                            <span style={{ fontSize: '13px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                              {item.votes || 0}
                            </span>
                          </button>

                          {/* Right: Message details */}
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {/* Line 1: Category, status badges, and timestamp */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{
                                padding: '2px 8px', borderRadius: '4px', fontSize: '9px',
                                fontFamily: 'var(--font-headings)', letterSpacing: '0.04em',
                                background: catCol.bg, border: `1px solid ${catCol.border}`, color: catCol.text,
                              }}>
                                {item.category}
                              </span>
                              <span style={{
                                padding: '2px 8px', borderRadius: '4px', fontSize: '9px',
                                fontFamily: 'var(--font-headings)', letterSpacing: '0.04em',
                                background: statusMeta.bg, border: `1px solid ${statusMeta.border}`, color: statusMeta.text,
                              }}>
                                {statusMeta.label}
                              </span>
                              <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--sand-dark)', fontFamily: 'monospace' }}>
                                {timeAgo(item.submitted_at)}
                              </span>
                            </div>

                            {/* Line 2: Subject */}
                            <h4 style={{
                              fontSize: '15px', color: 'var(--sand-light)', letterSpacing: '0.04em',
                              margin: 0, cursor: 'pointer', fontFamily: 'var(--font-headings)'
                            }} onClick={() => toggleExpand(item.id)}>
                              {item.subject}
                            </h4>

                            {/* Line 3: Message / Description */}
                            <p style={{
                              fontSize: '12.5px', color: 'var(--sand-dim)', lineHeight: 1.6,
                              margin: 0, whiteSpace: 'pre-wrap', cursor: 'pointer'
                            }} onClick={() => toggleExpand(item.id)}>
                              {isExpanded ? item.message : (
                                item.message.length > 180 
                                  ? `${item.message.slice(0, 180)}...` 
                                  : item.message
                              )}
                              {item.message.length > 180 && (
                                <span style={{ color: 'var(--gold)', marginLeft: '6px', fontSize: '11px', display: 'inline-block', fontWeight: 'bold' }}>
                                  {isExpanded ? 'Show less' : 'Read more'}
                                </span>
                              )}
                            </p>

                            {/* Line 4: Creator footer */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', fontSize: '10px', color: 'var(--sand-dark)', borderTop: '1px solid rgba(212,175,55,0.03)', paddingTop: '6px' }}>
                              <span>Suggested by: <strong style={{ color: 'var(--sand-dim)' }}>{item.user_email}</strong></span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════ ROADMAP TAB ════════════════════ */}
          {activeTab === 'roadmap' && (
            <div>
              <div style={{ borderBottom: '1px solid rgba(212,175,55,0.08)', paddingBottom: '12px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', textTransform: 'uppercase', color: 'var(--gold)', margin: '0 0 4px' }}>
                  Product Roadmap
                </h2>
                <p style={{ fontSize: '12.5px', color: 'var(--sand-dim)', margin: 0 }}>
                  Take a look at the features we are prioritizing and building, sorted by development phases.
                </p>
              </div>

              {loading ? (
                <div className="feedback-portal-card" style={{ padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                  <Loader2 size={32} className="animate-spin" style={{ color: 'var(--gold)' }} />
                  <span style={{ fontSize: '13px', color: 'var(--sand-dim)', fontFamily: 'var(--font-headings)' }}>
                    Loading roadmap boards...
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  
                  {/* Column 1: Under Review */}
                  <div className="roadmap-column">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(212,175,55,0.15)', paddingBottom: '10px', marginBottom: '14px' }}>
                      <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, color: 'var(--gold)' }}>
                        Under Review
                      </h3>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--sand-dark)', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '12px' }}>
                        {roadmapUnderReview.length}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '60vh' }}>
                      {roadmapUnderReview.length === 0 ? (
                        <p style={{ fontSize: '12px', color: 'var(--sand-dark)', textAlign: 'center', padding: '24px 0', margin: 0 }}>
                          No ideas in this chamber.
                        </p>
                      ) : (
                        roadmapUnderReview.map(item => (
                          <div key={item.id} className="roadmap-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                              <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.04em', color: CATEGORY_COLORS[item.category]?.text || 'var(--gold-dim)' }}>
                                {item.category}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', fontFamily: 'monospace', color: 'var(--gold)' }}>
                                <ArrowUp size={11} strokeWidth={3} />
                                <strong>{item.votes || 0}</strong>
                              </div>
                            </div>
                            <h4 style={{ fontSize: '13.5px', color: 'var(--sand-light)', margin: 0, fontFamily: 'var(--font-headings)', letterSpacing: '0.02em', lineHeight: 1.4 }}>
                              {item.subject}
                            </h4>
                            <p style={{ fontSize: '11.5px', color: 'var(--sand-dim)', margin: 0, lineClamp: 3, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                              {item.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Column 2: In Progress */}
                  <div className="roadmap-column" style={{ borderTop: '2px solid #FB923C' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(251,146,60,0.2)', paddingBottom: '10px', marginBottom: '14px' }}>
                      <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, color: '#FB923C' }}>
                        In Progress
                      </h3>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--sand-dark)', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '12px' }}>
                        {roadmapInProgress.length}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '60vh' }}>
                      {roadmapInProgress.length === 0 ? (
                        <p style={{ fontSize: '12px', color: 'var(--sand-dark)', textAlign: 'center', padding: '24px 0', margin: 0 }}>
                          Nothing is actively being carved.
                        </p>
                      ) : (
                        roadmapInProgress.map(item => (
                          <div key={item.id} className="roadmap-card" style={{ borderColor: 'rgba(251,146,60,0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                              <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.04em', color: CATEGORY_COLORS[item.category]?.text || 'var(--gold-dim)' }}>
                                {item.category}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', fontFamily: 'monospace', color: '#FB923C' }}>
                                <ArrowUp size={11} strokeWidth={3} />
                                <strong>{item.votes || 0}</strong>
                              </div>
                            </div>
                            <h4 style={{ fontSize: '13.5px', color: 'var(--sand-light)', margin: 0, fontFamily: 'var(--font-headings)', letterSpacing: '0.02em', lineHeight: 1.4 }}>
                              {item.subject}
                            </h4>
                            <p style={{ fontSize: '11.5px', color: 'var(--sand-dim)', margin: 0, lineClamp: 3, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                              {item.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Column 3: Completed */}
                  <div className="roadmap-column" style={{ borderTop: '2px solid #34D399' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(52,211,153,0.2)', paddingBottom: '10px', marginBottom: '14px' }}>
                      <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, color: '#34D399' }}>
                        Completed
                      </h3>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--sand-dark)', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '12px' }}>
                        {roadmapCompleted.length}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '60vh' }}>
                      {roadmapCompleted.length === 0 ? (
                        <p style={{ fontSize: '12px', color: 'var(--sand-dark)', textAlign: 'center', padding: '24px 0', margin: 0 }}>
                          No completions recorded yet.
                        </p>
                      ) : (
                        roadmapCompleted.map(item => (
                          <div key={item.id} className="roadmap-card" style={{ borderColor: 'rgba(52,211,153,0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                              <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.04em', color: CATEGORY_COLORS[item.category]?.text || 'var(--gold-dim)' }}>
                                {item.category}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', fontFamily: 'monospace', color: '#34D399' }}>
                                <ArrowUp size={11} strokeWidth={3} />
                                <strong>{item.votes || 0}</strong>
                              </div>
                            </div>
                            <h4 style={{ fontSize: '13.5px', color: 'var(--sand-light)', margin: 0, fontFamily: 'var(--font-headings)', letterSpacing: '0.02em', lineHeight: 1.4 }}>
                              {item.subject}
                            </h4>
                            <p style={{ fontSize: '11.5px', color: 'var(--sand-dim)', margin: 0, lineClamp: 3, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                              {item.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* ════════════════════ CHANGELOG TAB ════════════════════ */}
          {activeTab === 'changelog' && (
            <div>
              <div style={{ borderBottom: '1px solid rgba(212,175,55,0.08)', paddingBottom: '12px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', textTransform: 'uppercase', color: 'var(--gold)', margin: '0 0 4px' }}>
                  Changelog & Release Notes
                </h2>
                <p style={{ fontSize: '12.5px', color: 'var(--sand-dim)', margin: 0 }}>
                  Follow along with our updates, bug fixes, and latest feature releases.
                </p>
              </div>

              {loading ? (
                <div className="feedback-portal-card" style={{ padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                  <Loader2 size={32} className="animate-spin" style={{ color: 'var(--gold)' }} />
                  <span style={{ fontSize: '13px', color: 'var(--sand-dim)', fontFamily: 'var(--font-headings)' }}>
                    Opening product release scrolls...
                  </span>
                </div>
              ) : changelogSubmissions.length === 0 ? (
                <div className="feedback-portal-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <Megaphone size={32} style={{ color: 'var(--sand-dark)', margin: '0 auto 12px' }} />
                  <p style={{ fontSize: '14px', color: 'var(--sand-dim)', margin: 0 }}>
                    No releases recorded in this portal yet.
                  </p>
                </div>
              ) : (
                <div className="feedback-portal-card" style={{ padding: '32px 40px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {changelogSubmissions.map((item) => (
                      <div key={item.id} className="changelog-timeline-item">
                        {/* Bullet indicator */}
                        <div className="changelog-timeline-dot" />
                        
                        {/* Content */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {/* Date and tags */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11px', color: 'var(--gold)', fontFamily: 'monospace', fontWeight: 'bold' }}>
                              {item.resolved_at ? new Date(item.resolved_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : timeAgo(item.submitted_at)}
                            </span>
                            <span style={{
                              padding: '2px 8px', borderRadius: '4px', fontSize: '9px',
                              fontFamily: 'var(--font-headings)', letterSpacing: '0.04em',
                              background: CATEGORY_COLORS[item.category]?.bg || 'rgba(212,175,55,0.06)',
                              border: `1px solid ${CATEGORY_COLORS[item.category]?.border || 'rgba(212,175,55,0.12)'}`,
                              color: CATEGORY_COLORS[item.category]?.text || 'var(--gold-dim)',
                            }}>
                              {item.category}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 style={{ fontSize: '16px', color: 'var(--sand-light)', margin: 0, fontFamily: 'var(--font-headings)', letterSpacing: '0.04em' }}>
                            {item.subject}
                          </h3>

                          {/* Description */}
                          <p style={{ fontSize: '13px', color: 'var(--sand-dim)', lineHeight: 1.6, margin: 0 }}>
                            {item.message}
                          </p>

                          {/* Release notes (admin notes) */}
                          {item.admin_notes && (
                            <div style={{
                              marginTop: '12px',
                              padding: '14px 16px',
                              background: 'rgba(212, 175, 55, 0.03)',
                              borderLeft: '2px solid var(--gold)',
                              borderTopRightRadius: '8px',
                              borderBottomRightRadius: '8px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px'
                            }}>
                              <span style={{ fontSize: '10px', color: 'var(--gold-bright)', fontFamily: 'var(--font-headings)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                Scribe Release Notes:
                              </span>
                              <p style={{ fontSize: '12.5px', color: 'var(--sand-light)', fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>
                                {item.admin_notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
