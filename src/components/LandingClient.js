'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import GlowingCard from './GlowingCard';
import EyeOfHorusLoader from './EyeOfHorusLoader';
import CustomSelect from './CustomSelect';

const AnkhScene = dynamic(() => import('./AnkhScene'), { ssr: false });
const EyeScene  = dynamic(() => import('./EyeScene'),  { ssr: false });

import {
  Scroll,
  QrCode,
  BarChart3,
  BookOpen,
  FileDown,
  Send,
  Megaphone,
  Shield,
  Zap,
  Lock,
  Globe,
  Palette,
  Sparkles,
  AlertCircle,
  Calendar,
  CreditCard,
  Users,
  Bot,
  Clock,
  RefreshCw,
  Table,
  Bell,
  Award,
  History,
  Key,
  MessageCircle,
  Download,
  Volume2,
  VolumeX
} from 'lucide-react';

function InstrumentIcon({ id, size = 24 }) {
  switch (id) {
    case 'forms': return <Scroll size={size} />;
    case 'qr': return <QrCode size={size} />;
    case 'charts': return <BarChart3 size={size} />;
    case 'publisher': return <BookOpen size={size} />;
    case 'pdf': return <FileDown size={size} />;
    case 'mail': return <Send size={size} />;
    case 'social': return <Megaphone size={size} />;
    case 'sphinx': return <Shield size={size} />;
    case 'booking': return <Calendar size={size} />;
    case 'invoice': return <CreditCard size={size} />;
    case 'portal': return <Users size={size} />;
    case 'chatbot': return <Bot size={size} />;
    case 'timetracking': return <Clock size={size} />;
    case 'website': return <Globe size={size} />;
    case 'crmsync': return <RefreshCw size={size} />;
    case 'sheetsync': return <Table size={size} />;
    case 'notifications': return <Bell size={size} />;
    case 'certificate': return <Award size={size} />;
    case 'versioncontrol': return <History size={size} />;
    case 'permissions': return <Key size={size} />;
    case 'whatsapp': return <MessageCircle size={size} />;
    case 'exportsuite': return <Download size={size} />;
    default: return <Zap size={size} />;
  }
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const INSTRUMENTS = [
  { id: 'forms', name: 'The Nile Scribe', subtitle: 'ADVANCED FORM BUILDER', status: 'coming-soon', description: 'Configure public-facing themed survey forms that map directly to Notion columns. Replies instantly create new rows in your database.' },
  { id: 'qr', name: 'The Glyph Carver', subtitle: 'QR CODE GENERATOR', status: 'live', description: 'Translate URLs in Notion columns into custom-colored, brandable QR Code images. Supports instant button triggers and automation.' },
  { id: 'charts', name: 'The Aten Gazer', subtitle: 'ADVANCED ANALYTICS DASHBOARD', status: 'coming-soon', description: 'Transform dry Notion data columns into interactive charts — bar, pie, line — to track tasks, finances, or project progress.' },
  { id: 'publisher', name: 'The Papyrus Publisher', subtitle: 'NOTION CMS & BLOGS', status: 'coming-soon', description: 'Publish blog posts and public-facing web pages directly from Notion database entries. Your CMS lives inside Notion.' },
  { id: 'pdf', name: 'The Rosetta Press', subtitle: 'PDF GENERATOR', status: 'coming-soon', description: 'Export Notion pages and database records as beautifully formatted PDF documents with custom branding and layout options.' },
  { id: 'mail', name: 'The Nile Dispatch', subtitle: 'EMAIL CAMPAIGNS', status: 'coming-soon', description: 'Send branded email campaigns driven entirely by your Notion database. Write in Notion, dispatch to your subscribers.' },
  { id: 'social', name: 'The Royal Herald', subtitle: 'SOCIAL MEDIA PUBLISHER', status: 'coming-soon', description: 'Schedule and publish social posts automatically from Notion. One database, all your social channels synchronized.' },
  { id: 'sphinx', name: 'The Sphinx Shield', subtitle: 'PORTAL SECURITY & VAULTS', status: 'coming-soon', description: 'Password-protect any public-facing TJESA output with a secure gate. Control who enters each portal you create.' },
  { id: 'booking', name: 'The Temple Registrar', subtitle: 'BOOKING & SCHEDULING', status: 'coming-soon', description: 'Reserve and schedule sessions, consultations, or resources directly into Notion calendar databases with visual booking widgets.' },
  { id: 'invoice', name: 'The Pharaoh\'s Treasury', subtitle: 'INVOICE & PAYMENT SYSTEM', status: 'coming-soon', description: 'Generate invoice bills and collect secure Stripe payments linked straight to your Notion transaction logs.' },
  { id: 'portal', name: 'The Sacred Sanctuary', subtitle: 'CLIENT PORTAL GENERATOR', status: 'coming-soon', description: 'Create private login areas for your clients to access their personal Notion database rows, files, and project updates.' },
  { id: 'chatbot', name: 'The Alexandria Oracle', subtitle: 'AI CHATBOT FROM NOTION KB', status: 'coming-soon', description: 'Train an intelligent conversational AI chatbot using your Notion database pages as a knowledge base. Embed it anywhere.' },
  { id: 'timetracking', name: 'The Sun Shadow', subtitle: 'TIME TRACKING & BILLING', status: 'coming-soon', description: 'Track client billable hours with live stopwatch timers that log entries and compute totals directly in Notion.' },
  { id: 'website', name: 'The Dynasty Builder', subtitle: 'WEBSITE BUILDER FROM NOTION', status: 'coming-soon', description: 'Convert entire Notion workspace structures into lightning-fast, SEO-optimized custom public websites with custom navigation.' },
  { id: 'crmsync', name: 'The Vizier\'s Ledger', subtitle: 'TWO-WAY CRM SYNC', status: 'coming-soon', description: 'Bi-directionally synchronize Notion databases with Salesforce, Hubspot, and other CRM suites in real-time.' },
  { id: 'sheetsync', name: 'The Obelisk Alignment', subtitle: 'SPREADSHEET SYNC', status: 'coming-soon', description: 'Establish continuous real-time sync routes between Google Sheets, Excel, and your Notion workspace databases.' },
  { id: 'notifications', name: 'The Falcon Cry', subtitle: 'SMART NOTIFICATIONS & ALERTS', status: 'coming-soon', description: 'Trigger SMS, Email, or Slack alerts the moment database properties change or tasks pass their deadline.' },
  { id: 'certificate', name: 'The Cartouche Press', subtitle: 'CERTIFICATE & BADGE GENERATOR', status: 'coming-soon', description: 'Issue custom branded certificates, credentials, and digital badges generated automatically from Notion attendee databases.' },
  { id: 'versioncontrol', name: 'The Chronos Scroll', subtitle: 'VERSION CONTROL & HISTORY', status: 'coming-soon', description: 'Track, compare, and revert structural changes and row edits in your Notion database schemas over time.' },
  { id: 'permissions', name: 'The High Priest Gate', subtitle: 'ADVANCED PERMISSIONS & ROLES', status: 'coming-soon', description: 'Define granular row-level and column-level access control rules for team members interacting with Notion data.' },
  { id: 'whatsapp', name: 'The Anubis Messenger', subtitle: 'WHATSAPP / SMS BOT', status: 'coming-soon', description: 'Interact with and query your Notion databases on the go via simple WhatsApp or SMS text commands.' },
  { id: 'exportsuite', name: 'The Library Exporter', subtitle: 'MULTI-FORMAT EXPORT SUITE', status: 'coming-soon', description: 'Bulk export entire Notion databases and sub-pages into Markdown, CSV, XML, JSON, or PDF formats in one click.' }
];

// STEPS and FAQS constants removed to streamline layout

// ─── TJESA Logo SVG ────────────────────────────────────────────────────────────
function TjesaLogo({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none" style={{ filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.5))' }}>
      <rect x="4" y="4" width="20" height="20" rx="3" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
      <rect x="28" y="4" width="20" height="20" rx="3" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
      <rect x="4" y="28" width="20" height="20" rx="3" fill="none" stroke="#8C6E2E" strokeWidth="1.5" />
      <rect x="28" y="28" width="20" height="20" rx="3" fill="none" stroke="#8C6E2E" strokeWidth="1.5" />
      <path d="M24 14 L28 14 M24 38 L28 38 M14 24 L14 28 M38 24 L38 28" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" />
      <circle cx="26" cy="26" r="3" fill="#C9A84C" />
      <circle cx="26" cy="26" r="1.5" fill="#0A0A0B" />
    </svg>
  );
}

// ─── Animated Counter ──────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    started.current = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const numericTarget = parseInt(target.replace(/\D/g, ''), 10) || 0;
          const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * numericTarget));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  const displayTarget = target.replace(/\d+/, '');
  return <span ref={ref}>{count}{displayTarget}{suffix}</span>;
}

// FaqItem component removed to streamline layout

// ─── (Pharaoh SVG removed — replaced with 3D Eye of Horus) ───────────────────
function _unused_FloatingPharaoh() {
  return (
    <div className="pharaoh-character">
      <svg viewBox="0 0 130 310" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
        <defs>
          <radialGradient id="pharaohAura" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"/>
          </radialGradient>
        </defs>

        {/* Aura glow behind whole figure */}
        <ellipse cx="62" cy="140" rx="52" ry="115" fill="url(#pharaohAura)"/>

        {/* ── NEMES HEADDRESS ── */}
        {/* Top crown band */}
        <rect x="26" y="12" width="68" height="11" rx="3" fill="#C9A84C"/>
        {/* Uraeus cobra */}
        <path d="M 57 12 C 55 7 53 4 56 1 C 59 -1 63 2 60 7 L 57 12 Z" fill="#FFD700"/>
        {/* Main cloth dome */}
        <path d="M 26 18 C 26 18 44 26 60 26 C 76 26 94 18 94 18 L 90 52 C 90 52 78 58 60 58 C 42 58 30 52 26 52 Z" fill="#C9A84C" opacity="0.88"/>
        {/* Front lappet (falls left over chest) */}
        <path d="M 30 52 C 28 56 24 66 22 84 C 20 102 22 118 26 126 L 38 124 C 34 114 32 100 34 84 C 36 68 40 56 40 52 Z" fill="#C9A84C" opacity="0.8"/>
        {/* Back lappet (falls right behind shoulder) */}
        <path d="M 90 52 C 92 56 98 68 100 86 C 102 102 100 114 98 122 L 87 120 C 89 112 91 100 89 86 C 87 68 83 56 80 52 Z" fill="#C9A84C" opacity="0.75"/>
        {/* Lappet stripes */}
        <line x1="22" y1="72" x2="38" y2="70" stroke="#0D0D0B" strokeWidth="2" opacity="0.22"/>
        <line x1="21" y1="86" x2="37" y2="84" stroke="#0D0D0B" strokeWidth="2" opacity="0.22"/>
        <line x1="21" y1="100" x2="36" y2="98" stroke="#0D0D0B" strokeWidth="2" opacity="0.22"/>
        <line x1="22" y1="114" x2="37" y2="113" stroke="#0D0D0B" strokeWidth="2" opacity="0.22"/>

        {/* ── FACE (profile, facing left) ── */}
        <path d="M 38 22 C 29 27 18 38 16 54 C 14 68 16 80 23 90 C 27 96 34 100 40 100 C 46 100 50 94 48 86 C 46 80 39 76 41 67 C 43 58 49 52 47 43 C 45 36 43 28 38 22 Z" fill="#C9A84C" opacity="0.88"/>
        {/* Eye of Horus — glowing */}
        <ellipse cx="27" cy="57" rx="7" ry="5" fill="#141410" opacity="0.95"/>
        <ellipse cx="27" cy="57" rx="3" ry="3" fill="#FFD700" style={{ animation: 'eyeGlowPulse 3.5s ease-in-out infinite' }}/>
        {/* Kohl liner */}
        <path d="M 14 57 L 22 57" stroke="#141410" strokeWidth="1.5" opacity="0.5"/>
        <path d="M 34 55 L 40 52" stroke="#141410" strokeWidth="1.5" opacity="0.5"/>
        {/* Nose bump */}
        <path d="M 15 68 C 12 72 13 78 17 80" stroke="#0D0D0B" strokeWidth="1.5" fill="none" opacity="0.18"/>

        {/* ── FALSE BEARD ── */}
        <path d="M 21 98 L 16 112 C 15 116 18 120 22 119 L 28 117 L 32 101 Z" fill="#C9A84C" opacity="0.78"/>

        {/* ── NECK ── */}
        <rect x="34" y="98" width="15" height="16" rx="3" fill="#C9A84C" opacity="0.82"/>

        {/* ── BROAD COLLAR (Wesekh) ── */}
        <path d="M 20 112 Q 52 130 92 114 L 94 122 Q 52 142 18 122 Z" fill="#C9A84C" opacity="0.68"/>
        <path d="M 22 116 Q 52 132 90 118" stroke="#FFD700" strokeWidth="1" fill="none" opacity="0.45"/>
        <path d="M 21 122 Q 52 138 90 124" stroke="#FFD700" strokeWidth="1" fill="none" opacity="0.28"/>

        {/* ── TORSO ── */}
        <path d="M 20 120 L 92 114 L 96 202 L 16 202 Z" fill="#C9A84C" opacity="0.7"/>

        {/* ── ARMS ── */}
        {/* Right arm raised (to staff) */}
        <path d="M 90 120 L 102 90 L 110 95 L 98 126 Z" fill="#C9A84C" opacity="0.72"/>
        {/* Left arm lowered (crook) */}
        <path d="M 20 122 L 8 146 L 15 152 L 27 128 Z" fill="#C9A84C" opacity="0.72"/>

        {/* ── SHENDYT KILT ── */}
        <path d="M 16 200 L 96 200 L 102 266 L 10 266 Z" fill="#C9A84C" opacity="0.66"/>
        {/* Kilt apron panel */}
        <path d="M 40 200 L 72 200 L 74 244 L 38 244 Z" fill="#FFD700" opacity="0.18"/>
        <line x1="56" y1="200" x2="58" y2="266" stroke="#FFD700" strokeWidth="1" opacity="0.22"/>

        {/* ── LEGS ── */}
        <rect x="18" y="264" width="24" height="22" rx="4" fill="#C9A84C" opacity="0.7"/>
        <rect x="68" y="264" width="24" height="22" rx="4" fill="#C9A84C" opacity="0.65"/>
        {/* Sandal bases */}
        <path d="M 14 284 L 46 284 L 42 292 L 12 290 Z" fill="#C9A84C" opacity="0.6"/>
        <path d="M 64 286 L 96 286 L 95 292 L 62 292 Z" fill="#C9A84C" opacity="0.55"/>

        {/* ── WAS SCEPTER ── */}
        {/* Shaft */}
        <line x1="110" y1="82" x2="118" y2="290" stroke="#C9A84C" strokeWidth="4" strokeLinecap="round" opacity="0.78"/>
        {/* Was head (animal top — stylized) */}
        <path d="M 103 80 C 101 70 106 62 113 65 C 119 68 120 76 116 83 L 110 85 Z" fill="#FFD700" style={{ animation: 'staffTopPulse 4s ease-in-out infinite' }}/>
        {/* Ears on Was head */}
        <path d="M 104 72 C 100 66 102 60 106 62" stroke="#FFD700" strokeWidth="2" fill="none" opacity="0.7"/>
        {/* Forked base */}
        <path d="M 115 284 L 111 292 L 121 292 L 118 284 Z" fill="#C9A84C" opacity="0.8"/>
      </svg>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function LandingClient({ oauthUrl, initialWaitlistCount = 0 }) {
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState('');
  const [showAllTools, setShowAllTools] = useState(false);

  // Waitlist States
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [excitedTool, setExcitedTool] = useState('');
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');
  const [waitlistCount, setWaitlistCount] = useState(initialWaitlistCount);


  // UTM tracking state
  const [utmParams, setUtmParams] = useState({
    utm_source: '',
    utm_medium: '',
    utm_campaign: ''
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const utm_source = urlParams.get('utm_source') || '';
      const utm_medium = urlParams.get('utm_medium') || '';
      const utm_campaign = urlParams.get('utm_campaign') || '';

      if (utm_source) {
        const params = { utm_source, utm_medium, utm_campaign };
        localStorage.setItem('tjesa_utm', JSON.stringify(params));
        setTimeout(() => {
          setUtmParams(params);
        }, 0);
      } else {
        const saved = localStorage.getItem('tjesa_utm');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setTimeout(() => {
              setUtmParams(parsed);
            }, 0);
          } catch (e) {
            console.error('[UTM Error]', e);
          }
        }
      }
    }
  }, []);

  // Audio
  const audioRef = useRef(null);
  const fadingRef = useRef(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  const toggleMusic = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/audio/mystic-ambient.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0;
    }
    if (fadingRef.current) clearInterval(fadingRef.current);

    if (isMusicPlaying) {
      let vol = audioRef.current.volume;
      fadingRef.current = setInterval(() => {
        vol = Math.max(0, vol - 0.02);
        audioRef.current.volume = vol;
        if (vol <= 0) { clearInterval(fadingRef.current); audioRef.current.pause(); }
      }, 40);
      setIsMusicPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      let vol = 0;
      fadingRef.current = setInterval(() => {
        vol = Math.min(0.45, vol + 0.015);
        audioRef.current.volume = vol;
        if (vol >= 0.45) clearInterval(fadingRef.current);
      }, 40);
      setIsMusicPlaying(true);
    }
  }, [isMusicPlaying]);

  useEffect(() => {
    return () => {
      if (fadingRef.current) clearInterval(fadingRef.current);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, []);

  // Portal Modal States
  const [portalOpen, setPortalOpen] = useState(false);
  const [token, setToken] = useState('');
  const [logoClicks, setLogoClicks] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      const sections = ['features', 'waitlist-section'];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom > 100) { setActiveSection(id); break; }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogoClick = () => {
    setLogoClicks(prev => {
      const next = prev + 1;
      if (next >= 5) { triggerBypass(); return 0; }
      return next;
    });
  };

  const triggerBypass = async () => {
    try {
      const response = await fetch('/api/auth/bypass', { method: 'POST' });
      if (response.ok) router.push('/dashboard');
      else setPortalOpen(true);
    } catch { setPortalOpen(true); }
  };

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    if (!email || !name || !excitedTool) return;
    setWaitlistLoading(true);
    setWaitlistError('');
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          name, 
          excitedTool,
          utm_source: utmParams.utm_source,
          utm_medium: utmParams.utm_medium,
          utm_campaign: utmParams.utm_campaign
        }),
      });
      const data = await response.json();
      if (response.ok) { 
        setWaitlistSuccess(true); 
        setWaitlistCount(prev => prev + 1);
        setEmail(''); 
        setName('');
        setExcitedTool('');

        // Trigger Meta Pixel Lead event
        if (typeof window !== 'undefined' && window.fbq) {
          window.fbq('track', 'Lead', {
            content_name: 'Waitlist Signup',
            status: 'success'
          });
        }
      }
      else setWaitlistError(data.error || 'Failed to join waitlist.');
    } catch { setWaitlistError('An ancient curse disrupted the connection. Try again.'); }
    finally { setWaitlistLoading(false); }
  };

  const handleTokenSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/token', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (response.ok) { setPortalOpen(false); router.push('/dashboard'); }
      else setError(data.error || 'Failed to bind token.');
    } catch { setError('Connection disrupted. Please try again.'); }
    finally { setIsLoading(false); }
  };

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  const NAV_LINKS = [
    { label: 'Instruments', id: 'features' },
    { label: 'Waitlist', id: 'waitlist-section' },
  ];

  return (
    <>
      <style>{`
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          33% { transform: translate(60px, -80px) scale(1.1); opacity: 0.7; }
          66% { transform: translate(-40px, 40px) scale(0.9); opacity: 0.4; }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
          33% { transform: translate(-70px, 60px) scale(1.15); opacity: 0.6; }
          66% { transform: translate(50px, -50px) scale(0.95); opacity: 0.3; }
        }
        @keyframes orbFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.35; }
          50% { transform: translate(30px, -100px) scale(1.2); opacity: 0.55; }
        }
        @keyframes heroShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes scrollBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(8px); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes marqueeScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes pharaohFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes pharaohFadeIn {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes eyeGlowPulse {
          0%, 100% { opacity: 0.85; filter: drop-shadow(0 0 3px #FFD700); }
          50% { opacity: 1; filter: drop-shadow(0 0 8px #FFD700) drop-shadow(0 0 14px rgba(212,175,55,0.6)); }
        }
        @keyframes staffTopPulse {
          0%, 100% { opacity: 0.8; filter: drop-shadow(0 0 4px rgba(255,215,0,0.4)); }
          50% { opacity: 1; filter: drop-shadow(0 0 12px rgba(255,215,0,0.9)); }
        }
        @keyframes musicRipple {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .eye-scene-wrap {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          width: 360px; height: 340px;
          pointer-events: none; z-index: 0;
          opacity: 0; animation: fadeIn 2s ease 1.4s forwards;
        }
        @media (max-width: 1100px) { .eye-scene-wrap { display: none !important; } }
        .ankh-scene-wrap {
          position: absolute; left: 3%; top: 50%; transform: translateY(-50%);
          width: 260px; height: 380px;
          pointer-events: none; z-index: 0;
          opacity: 0; animation: fadeIn 2s ease 1.2s forwards;
        }
        @media (max-width: 960px) { .ankh-scene-wrap { display: none !important; } }
        @keyframes pricingGlow {
          0%, 100% { box-shadow: 0 0 24px rgba(212,175,55,0.15), 0 20px 40px rgba(0,0,0,0.6); }
          50% { box-shadow: 0 0 40px rgba(212,175,55,0.28), 0 20px 40px rgba(0,0,0,0.6); }
        }
        @keyframes badgePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(52,211,153,0); }
        }
        .landing-hero-title {
          background: linear-gradient(90deg, #AA8928, #FFDF73, #D4AF37, #FFDF73, #AA8928);
          background-size: 300% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: heroShimmer 4s linear infinite;
        }
        .landing-cta-primary {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 14px 32px;
          background: linear-gradient(135deg, #D4AF37 0%, #AA8928 50%, #FFDF73 100%);
          color: #0D0D0B; border: none; border-radius: 8px;
          font-family: var(--font-headings); font-weight: 700; font-size: 13px; letter-spacing: 0.1em;
          cursor: pointer; box-shadow: 0 4px 20px rgba(212,175,55,0.35);
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1); text-decoration: none;
        }
        .landing-cta-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(212,175,55,0.5), 0 0 20px rgba(212,175,55,0.25);
        }
        .landing-cta-secondary {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 13px 28px; background: transparent; color: var(--gold);
          border: 1px solid rgba(212,175,55,0.4); border-radius: 8px;
          font-family: var(--font-headings); font-weight: 600; font-size: 13px; letter-spacing: 0.1em;
          cursor: pointer; transition: all 0.25s cubic-bezier(0.4,0,0.2,1); text-decoration: none;
        }
        .landing-cta-secondary:hover {
          background: rgba(212,175,55,0.08); border-color: var(--gold);
          box-shadow: 0 0 20px rgba(212,175,55,0.15);
        }
        .instrument-card { transition: all 0.3s ease; animation: fadeSlideUp 0.5s ease both; }
        .status-badge-live {
          display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px;
          background: rgba(52, 211, 153, 0.1); border: 1px solid rgba(52, 211, 153, 0.3);
          border-radius: 20px; font-size: 9px; color: #34D399;
          font-family: var(--font-headings); letter-spacing: 0.1em; text-transform: uppercase;
        }
        .status-badge-coming {
          display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px;
          background: rgba(212,175,55,0.08); border: 1px solid rgba(212,175,55,0.2);
          border-radius: 20px; font-size: 9px; color: var(--gold-dim);
          font-family: var(--font-headings); letter-spacing: 0.1em; text-transform: uppercase;
        }
        .section-label {
          font-size: 11px; color: var(--gold); letter-spacing: 0.25em;
          font-family: var(--font-headings); text-transform: uppercase;
          display: flex; align-items: center; justify-content: center; gap: 12px;
        }
        .section-label::before, .section-label::after {
          content: ''; width: 40px; height: 1px;
          background: linear-gradient(90deg, transparent, var(--gold));
        }
        .section-label::after { background: linear-gradient(90deg, var(--gold), transparent); }
        .landing-nav { backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); transition: background 0.3s ease, border-color 0.3s ease; }
        .nav-link {
          background: none; border: none; color: var(--sand-dark); cursor: pointer;
          font-family: var(--font-headings); font-size: 11px; letter-spacing: 0.12em;
          text-transform: uppercase; padding: 6px 10px; border-radius: 4px;
          transition: color 0.2s ease, background 0.2s ease;
        }
        .nav-link:hover { color: var(--gold); background: rgba(212,175,55,0.05); }
        .nav-link.active { color: var(--gold); }
        .instrument-emoji-wrap {
          width: 52px; height: 52px; border-radius: 14px;
          background: linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.04));
          border: 1px solid rgba(212,175,55,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; flex-shrink: 0; transition: all 0.3s ease;
        }
        .kemet-card:hover .instrument-emoji-wrap {
          background: linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.08));
          border-color: rgba(212,175,55,0.4); box-shadow: 0 0 16px rgba(212,175,55,0.15);
        }
        .testimonial-card {
          background: rgba(20,19,17,0.7); border: 1px solid rgba(212,175,55,0.1);
          border-radius: 14px; padding: 28px 24px;
          backdrop-filter: blur(12px); transition: all 0.3s ease;
        }
        .testimonial-card:hover {
          border-color: rgba(212,175,55,0.25); transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.4), 0 0 20px rgba(212,175,55,0.05);
        }
        .pricing-card-pro { animation: pricingGlow 3s ease-in-out infinite; }
        .pricing-row { display: grid; grid-template-columns: 1fr 100px 100px; gap: 0; }
        .marquee-track { display: flex; animation: marqueeScroll 28s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
        @media (max-width: 768px) {
          .pricing-row { grid-template-columns: 1fr 80px 80px; }
          .nav-links-desktop { display: none !important; }
        }
        .sacred-scroll-list::-webkit-scrollbar {
          width: 6px;
        }
        .sacred-scroll-list::-webkit-scrollbar-track {
          background: rgba(212,175,55,0.02);
          border-radius: 4px;
        }
        .sacred-scroll-list::-webkit-scrollbar-thumb {
          background: rgba(212,175,55,0.25);
          border-radius: 4px;
        }
        .sacred-scroll-list::-webkit-scrollbar-thumb:hover {
          background: rgba(212,175,55,0.45);
        }
        .vault-list-item {
          transition: all 0.25s ease;
        }
        .vault-list-item:hover {
          background: rgba(212,175,55,0.05);
          transform: translateX(4px);
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100vh', position: 'relative' }}>

        {/* ── NAVIGATION ─────────────────────────────────────────────────────── */}
        <nav
          className="landing-nav"
          style={{
            position: 'sticky', top: 0, zIndex: 100, width: '100%',
            padding: '0 32px', height: '64px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: scrollY > 40 ? 'rgba(13,13,11,0.92)' : 'transparent',
            borderBottom: scrollY > 40 ? '1px solid rgba(212,175,55,0.08)' : '1px solid transparent',
          }}
        >
          <div id="ankh-logo" onClick={handleLogoClick} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <TjesaLogo size={30} />
            <span style={{ fontFamily: 'var(--font-headings)', fontSize: '15px', letterSpacing: '0.15em', color: 'var(--gold)' }}>TJESA</span>
          </div>

          {/* Center nav links */}
          <div className="nav-links-desktop" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {NAV_LINKS.map(link => (
              <button key={link.id} className={`nav-link${activeSection === link.id ? ' active' : ''}`} onClick={() => scrollTo(link.id)}>
                {link.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Music toggle */}
            <button
              onClick={toggleMusic}
              title={isMusicPlaying ? 'Silence the chamber' : 'Awaken the ambient'}
              style={{
                position: 'relative',
                width: '34px', height: '34px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isMusicPlaying ? 'rgba(212,175,55,0.12)' : 'transparent',
                border: `1px solid ${isMusicPlaying ? 'rgba(212,175,55,0.4)' : 'rgba(212,175,55,0.18)'}`,
                borderRadius: '8px', cursor: 'pointer',
                color: isMusicPlaying ? 'var(--gold)' : 'var(--sand-dark)',
                transition: 'all 0.25s ease',
              }}
            >
              {isMusicPlaying
                ? <Volume2 size={15} />
                : <VolumeX size={15} />
              }
              {isMusicPlaying && (
                <span style={{
                  position: 'absolute', inset: 0, borderRadius: '8px',
                  border: '1px solid rgba(212,175,55,0.5)',
                  animation: 'musicRipple 1.8s ease-out infinite',
                  pointerEvents: 'none',
                }}/>
              )}
            </button>
            <button onClick={() => scrollTo('waitlist-section')} className="landing-cta-primary" style={{ padding: '8px 18px', fontSize: '11px' }}>Join Waitlist</button>
          </div>
        </nav>

        {/* ── HERO SECTION ────────────────────────────────────────────────────── */}
        <section style={{
          position: 'relative', minHeight: '92vh',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '80px 24px 60px', textAlign: 'center', overflow: 'hidden',
        }}>
          {/* Animated Orbs */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
            <div style={{ position: 'absolute', top: '10%', left: '5%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)', animation: 'orbFloat1 14s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', top: '45%', right: '2%', width: '440px', height: '440px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(30,70,138,0.12) 0%, transparent 70%)', animation: 'orbFloat2 18s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', bottom: '5%', left: '25%', width: '380px', height: '380px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)', animation: 'orbFloat3 22s ease-in-out infinite' }} />
          </div>

          {/* 3D Ankh — left guardian */}
          {/* <div className="ankh-scene-wrap">
            <AnkhScene />
          </div> */}

          {/* 3D Eye of Horus — right guardian */}
          {/* <div className="eye-scene-wrap">
            <EyeScene />
          </div> */}

          {/* Hero Content */}
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '820px', animation: 'fadeSlideUp 0.7s ease both' }}>
            {/* Live badge */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '6px 16px', borderRadius: '20px',
                background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)',
                fontSize: '11px', fontFamily: 'var(--font-headings)', letterSpacing: '0.12em', color: '#34D399',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34D399', display: 'inline-block', animation: 'badgePulse 2s ease infinite' }} />
                NOW IN EARLY ACCESS — QR CODE GENERATOR IS LIVE
              </div>
            </div>

            {/* Eyebrow */}
            <div className="section-label" style={{ marginBottom: '20px' }}>The Pharaonic Notion Suite</div>

            {/* Main title */}
            <h1 className="landing-hero-title" style={{
              fontSize: 'clamp(4.5rem, 12vw, 9rem)', fontFamily: 'var(--font-headings)',
              fontWeight: 700, letterSpacing: '0.22em', lineHeight: 0.9, paddingBottom: '0.1em', marginBottom: 'calc(28px - 0.1em)',
            }}>
              TJESA
            </h1>

            {/* Tagline */}
            <p style={{ fontSize: 'clamp(17px, 2.5vw, 22px)', color: 'var(--sand)', fontFamily: 'var(--font-headings)', letterSpacing: '0.04em', lineHeight: 1.4, marginBottom: '14px' }}>
              20+ Sacred Instruments.<br />One Notion Workspace.
            </p>

            <p style={{ fontSize: '15px', color: 'var(--sand-dim)', lineHeight: 1.75, maxWidth: '560px', margin: '0 auto 44px', fontFamily: 'var(--font-body)' }}>
              Generate forms, charts, QR codes, PDFs, emails, and blog posts — all driven directly from your Notion databases. No code. No extra platforms. No complexity.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => scrollTo('waitlist-section')} className="landing-cta-primary" style={{ fontSize: '14px', padding: '15px 36px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" /></svg>
                Join Waitlist — Reserve Seat
              </button>
              <button onClick={() => scrollTo('features')} className="landing-cta-secondary">
                Explore Instruments
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              </button>
            </div>

            {/* Animated Stat Pills */}
            <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '56px' }}>
              {[
                { value: '20+', label: 'Sacred Instruments' },
                { value: `${waitlistCount}+`, label: 'Architects Waiting' },
                { value: '0', label: 'Lines of Code Needed' },
              ].map(stat => (
                <div key={stat.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '30px', fontFamily: 'var(--font-headings)', color: 'var(--gold)', letterSpacing: '0.05em', lineHeight: 1 }}>
                    <AnimatedCounter target={stat.value} />
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--sand-dark)', letterSpacing: '0.12em', marginTop: '6px', fontFamily: 'var(--font-headings)', textTransform: 'uppercase' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll Indicator */}
          <div style={{
            position: 'absolute', bottom: '28px', left: '50%',
            transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
            animation: 'scrollBounce 2s ease-in-out infinite', opacity: 0.35, cursor: 'pointer',
          }} onClick={() => scrollTo('features')}>
            <span style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'var(--gold)', fontFamily: 'var(--font-headings)' }}>SCROLL</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
          </div>
        </section>

        {/* ── SOCIAL PROOF / MARQUEE ──────────────────────────────────────────── */}
        <div style={{ overflow: 'hidden', borderTop: '1px solid rgba(212,175,55,0.07)', borderBottom: '1px solid rgba(212,175,55,0.07)', padding: '18px 0', background: 'rgba(212,175,55,0.02)' }}>
          <div className="marquee-track">
            {[...Array(2)].map((_, gi) => (
              <div key={gi} style={{ display: 'flex', gap: '48px', paddingRight: '48px', flexShrink: 0, whiteSpace: 'nowrap', alignItems: 'center' }}>
                {[
                  { id: 'forms', label: 'Advanced Forms' },
                  { id: 'qr', label: 'QR Codes' },
                  { id: 'charts', label: 'Analytics' },
                  { id: 'publisher', label: 'Blog CMS' },
                  { id: 'pdf', label: 'PDF Generator' },
                  { id: 'mail', label: 'Email Campaigns' },
                  { id: 'social', label: 'Social Publisher' },
                  { id: 'sphinx', label: 'Portal Security' },
                  { id: 'booking', label: 'Booking & Scheduling' },
                  { id: 'invoice', label: 'Invoices & Payments' },
                  { id: 'portal', label: 'Client Portals' },
                  { id: 'chatbot', label: 'AI Chatbots' },
                  { id: 'timetracking', label: 'Time Tracking' },
                  { id: 'website', label: 'Website Builder' },
                  { id: 'crmsync', label: 'CRM Sync' },
                  { id: 'sheetsync', label: 'Spreadsheet Sync' },
                  { id: 'notifications', label: 'Smart Notifications' },
                  { id: 'certificate', label: 'Certificates' },
                  { id: 'versioncontrol', label: 'Version History' },
                  { id: 'permissions', label: 'Permissions & Roles' },
                  { id: 'whatsapp', label: 'WhatsApp / SMS Bot' },
                  { id: 'exportsuite', label: 'Multi-Format Export' },
                ].map(item => (
                  <span key={item.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-headings)', letterSpacing: '0.12em', color: 'var(--sand-dark)', textTransform: 'uppercase' }}>
                    <span style={{ color: 'var(--gold)', display: 'inline-flex' }}><InstrumentIcon id={item.id} size={14} /></span>
                    {item.label}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>


        {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
        <section style={{ padding: '100px 32px 0', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div className="section-label" style={{ marginBottom: '16px' }}>How It Works</div>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', letterSpacing: '0.08em', lineHeight: 1.2, margin: '0 0 16px' }}>
              Notion database → live product
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--sand-dim)', maxWidth: '460px', margin: '0 auto', lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>
              Three steps from your existing Notion workspace to a live, shareable output.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {[
              {
                step: '01',
                title: 'Connect Notion',
                description: 'Link your Notion workspace with one click via OAuth. No API keys, no configuration files — just click and authorize.',
                icon: <Key size={20} />,
              },
              {
                step: '02',
                title: 'Pick an Instrument',
                description: 'Select a database, choose a tool — form, chart, QR code, PDF — and map your columns to the right fields.',
                icon: <Zap size={20} />,
              },
              {
                step: '03',
                title: 'Go Live Instantly',
                description: 'Your output is live at a shareable URL the moment you save. Responses write back to Notion automatically.',
                icon: <Globe size={20} />,
              }
            ].map((item, i) => (
              <div key={item.step} style={{
                background: 'rgba(20,19,17,0.5)',
                border: '1px solid rgba(212,175,55,0.1)',
                borderRadius: '16px',
                padding: '32px 28px',
                backdropFilter: 'blur(8px)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.04))',
                    border: '1px solid rgba(212,175,55,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--gold)', flexShrink: 0,
                  }}>
                    {item.icon}
                  </div>
                  <span style={{ fontSize: '36px', fontFamily: 'var(--font-headings)', color: 'rgba(212,175,55,0.1)', lineHeight: 1 }}>
                    {item.step}
                  </span>
                </div>
                <h3 style={{ fontSize: '16px', letterSpacing: '0.05em', marginBottom: '10px', color: 'var(--sand-light)', fontFamily: 'var(--font-headings)' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--sand-dim)', lineHeight: 1.7, margin: 0, fontFamily: 'var(--font-body)' }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

{/* ── COMBINED DECK & WAITLIST SECTION ────────────────────────────────── */}
        <section id="features" style={{
          padding: '100px 32px',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          position: 'relative'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '48px',
            alignItems: 'start'
          }}>
            
            {/* Left Column — 22 Instruments List */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ marginBottom: '28px' }}>
                <div className="section-label" style={{ justifyContent: 'flex-start', marginBottom: '16px' }}>Sacred Instruments</div>
                <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', margin: '0 0 12px', letterSpacing: '0.08em', lineHeight: 1.2 }}>
                  20+ Tools. One Workspace.
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--sand-dim)', lineHeight: 1.6, fontFamily: 'var(--font-body)', margin: 0 }}>
                  A list of the Notion-integrated instruments we are building. Expand the vault to explore all 20+ tools.
                </p>
              </div>

              {/* Scrollable list of tools */}
              <div style={{
                maxHeight: '620px',
                overflowY: 'auto',
                paddingRight: '12px',
                border: '1px solid rgba(212,175,55,0.1)',
                borderRadius: '12px',
                background: 'rgba(20,19,17,0.3)',
                backdropFilter: 'blur(8px)',
                padding: '12px'
              }} className="sacred-scroll-list">
                {INSTRUMENTS.filter(inst => inst.status === 'live' || showAllTools).map((inst, i) => {
                  const isLive = inst.status === 'live';
                  const indexStr = String(i + 1).padStart(2, '0');
                  return (
                    <div 
                      key={inst.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 12px',
                        borderBottom: i < (INSTRUMENTS.length - 1) ? '1px solid rgba(212,175,55,0.06)' : 'none',
                      }}
                      className="vault-list-item"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '13px', fontFamily: 'var(--font-headings)', color: 'var(--gold)', opacity: 0.8, minWidth: '20px' }}>
                          {indexStr}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{ fontSize: '14px', color: 'var(--sand-light)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {inst.subtitle.replace('ADVANCED ', '').replace(' SYSTEM', '')}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--sand-dark)', letterSpacing: '0.08em', marginTop: '2px', fontFamily: 'var(--font-headings)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {inst.name}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className={isLive ? 'status-badge-live' : 'status-badge-coming'} style={{ fontSize: '8px', padding: '2px 8px' }}>
                          {isLive ? 'Live' : 'Soon'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Toggle vault button */}
              <div style={{ display: 'flex', marginTop: '16px' }}>
                <button
                  onClick={() => setShowAllTools(prev => !prev)}
                  className="landing-cta-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    fontSize: '11px',
                    letterSpacing: '0.08em',
                    borderColor: 'rgba(212,175,55,0.3)',
                    background: showAllTools ? 'rgba(212,175,55,0.08)' : 'transparent',
                  }}
                >
                  {showAllTools ? 'Close the Sacred Vault' : 'Reveal the Sacred Vault (View All 20+ Tools)'}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transition: 'transform 0.3s ease',
                      transform: showAllTools ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Right Column — Waitlist Signup Card */}
            <div id="waitlist-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', position: 'sticky', top: '90px' }}>
              
              {/* Spots Claimed Counter Box */}
              <div style={{
                background: 'rgba(20,19,17,0.4)',
                border: '1px solid rgba(212,175,55,0.15)',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'var(--sand-dark)', letterSpacing: '0.15em', fontFamily: 'var(--font-headings)', textTransform: 'uppercase' }}>
                    SPOTS CLAIMED
                  </span>
                  <span style={{ fontSize: '15px', color: 'var(--gold)', fontFamily: 'var(--font-headings)', fontWeight: 700 }}>
                    {waitlistCount} / 500
                  </span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'rgba(212,175,55,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, Math.max(3, (waitlistCount / 500) * 100))}%`, height: '100%', background: 'var(--gold-gradient)', borderRadius: '10px', boxShadow: '0 0 8px rgba(212,175,55,0.4)' }} />
                </div>
              </div>

              {/* Waitlist Card */}
              <div style={{
                background: 'var(--obsidian-card)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(212,175,55,0.25)',
                borderRadius: '18px',
                padding: '36px 32px',
                boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 40px rgba(212,175,55,0.04)',
                position: 'relative',
                overflow: 'visible',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--gold-gradient)', borderTopLeftRadius: '18px', borderTopRightRadius: '18px' }} />

                {waitlistSuccess ? (
                  <div style={{ animation: 'fadeSlideUp 0.4s ease both', padding: '16px 0', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--gold)', marginBottom: '18px' }}>
                      <Sparkles size={44} />
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-headings)', color: 'var(--gold)', fontSize: '20px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                      Carved in the Cartouche
                    </h3>
                    <p style={{ fontSize: '14px', color: 'var(--sand-dim)', lineHeight: 1.7, fontFamily: 'var(--font-body)', margin: 0 }}>
                      Your email is safely recorded. You will receive an exclusive notification the moment the gateway opens.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleWaitlistSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
                    
                    <div>
                      <span style={{ fontSize: '9px', color: 'var(--gold)', letterSpacing: '0.15em', fontFamily: 'var(--font-headings)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                        JOIN THE WAITLIST
                      </span>
                      <h3 style={{ fontSize: '22px', color: 'var(--sand-light)', fontFamily: 'var(--font-headings)', letterSpacing: '0.04em', margin: '0 0 8px', lineHeight: 1.2 }}>
                        Claim early access.<br />Shape what we build.
                      </h3>
                      <p style={{ fontSize: '12px', color: 'var(--sand-dim)', lineHeight: 1.5, margin: 0 }}>
                        First 500 signups get lifetime Pro access at no cost — and priority input on which tools ship first.
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      
                      {/* Name input */}
                      <div>
                        <label htmlFor="waitlist-name" style={{ fontSize: '9px', color: 'var(--sand-dark)', letterSpacing: '0.15em', fontFamily: 'var(--font-headings)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                          FULL NAME
                        </label>
                        <input
                          id="waitlist-name"
                          type="text"
                          className="kemet-input"
                          placeholder="Your name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          style={{ width: '100%', fontSize: '13px' }}
                        />
                      </div>

                      {/* Email input */}
                      <div>
                        <label htmlFor="waitlist-email" style={{ fontSize: '9px', color: 'var(--sand-dark)', letterSpacing: '0.15em', fontFamily: 'var(--font-headings)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                          EMAIL ADDRESS
                        </label>
                        <input
                          id="waitlist-email"
                          type="email"
                          className="kemet-input"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          style={{ width: '100%', fontSize: '13px' }}
                        />
                      </div>

                      {/* excitedTool Select Dropdown */}
                      <div>
                        <label htmlFor="waitlist-excited-tool" style={{ fontSize: '9px', color: 'var(--sand-dark)', letterSpacing: '0.15em', fontFamily: 'var(--font-headings)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                          WHICH TOOL EXCITES YOU MOST?
                        </label>
                        <CustomSelect
                          id="waitlist-excited-tool"
                          options={INSTRUMENTS.map(inst => ({
                            value: inst.name,
                            label: `${inst.name} (${inst.status === 'live' ? 'Live' : 'Soon'})`
                          }))}
                          value={excitedTool}
                          onChange={setExcitedTool}
                          placeholder="Select a tool →"
                          buttonStyle={{
                            fontSize: '13px',
                            background: 'rgba(13, 13, 11, 0.7)',
                            border: '1px solid rgba(212, 175, 55, 0.25)',
                          }}
                        />
                      </div>

                    </div>

                    <button
                      type="submit"
                      className="landing-cta-primary"
                      disabled={waitlistLoading || !email || !name || !excitedTool}
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        padding: '14px',
                        fontSize: '13px',
                        letterSpacing: '0.1em',
                        marginTop: '6px'
                      }}
                    >
                      {waitlistLoading ? 'Carving...' : 'CLAIM EARLY ACCESS'}
                    </button>

                    {waitlistError && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(168,36,36,0.08)', border: '1px solid rgba(168,36,36,0.4)', borderRadius: '6px', color: '#FF7F7F', fontSize: '12px', textAlign: 'left' }}>
                        <AlertCircle size={16} style={{ flexShrink: 0 }} />
                        {waitlistError}
                      </div>
                    )}

                    <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '10px', color: 'var(--sand-dark)', margin: 0, fontFamily: 'var(--font-body)' }}>
                      <Lock size={12} /> No spam. Unsubscribe anytime.
                    </p>
                  </form>
                )}
              </div>
            </div>

          </div>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
        <footer style={{ borderTop: '1px solid rgba(212,175,55,0.1)', padding: '48px 32px 32px', background: 'rgba(13,13,11,0.6)' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '40px' }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <TjesaLogo size={28} />
                <span style={{ fontFamily: 'var(--font-headings)', fontSize: '14px', letterSpacing: '0.15em', color: 'var(--gold)' }}>TJESA</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--sand-dark)', lineHeight: 1.7, maxWidth: '220px', fontFamily: 'var(--font-body)' }}>
                The Pharaonic Notion Suite. 22 sacred instruments, one workspace.
              </p>
            </div>

            {/* Product */}
            <div>
              <div style={{ fontSize: '10px', color: 'var(--gold)', fontFamily: 'var(--font-headings)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '14px' }}>Instruments</div>
              {[['Nile Scribe', 'Forms'], ['Glyph Carver', 'QR Codes'], ['Aten Gazer', 'Charts'], ['Papyrus Publisher', 'CMS'], ['Rosetta Press', 'PDF']].map(([name, type]) => (
                <div key={name} style={{ fontSize: '12px', color: 'var(--sand-dark)', marginBottom: '8px', fontFamily: 'var(--font-body)' }}>
                  {name} <span style={{ color: 'var(--sand-dark)', opacity: 0.5 }}>— {type}</span>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div>
              <div style={{ fontSize: '10px', color: 'var(--gold)', fontFamily: 'var(--font-headings)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '14px' }}>Navigate</div>
              {[
                { label: 'Instruments', action: () => scrollTo('features') },
                { label: 'Waitlist', action: () => scrollTo('waitlist-section') },
              ].map(link => (
                <button key={link.label} onClick={link.action} style={{ display: 'block', background: 'none', border: 'none', color: 'var(--sand-dark)', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-body)', padding: '0 0 8px', textAlign: 'left', transition: 'color 0.2s ease' }}
                  onMouseOver={e => e.currentTarget.style.color = 'var(--gold)'} onMouseOut={e => e.currentTarget.style.color = 'var(--sand-dark)'}>
                  {link.label}
                </button>
              ))}
            </div>

            {/* Legal */}
            <div>
              <div style={{ fontSize: '10px', color: 'var(--gold)', fontFamily: 'var(--font-headings)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '14px' }}>Legal</div>
              {[
                { label: 'Privacy Policy', path: '/privacy' },
                { label: 'Terms of Service', path: '/terms' },
                { label: 'Cookie Policy', path: '/cookies' }
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => router.push(item.path)}
                  style={{
                    display: 'block',
                    background: 'none',
                    border: 'none',
                    color: 'var(--sand-dark)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontFamily: 'var(--font-body)',
                    padding: '0 0 8px',
                    textAlign: 'left',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseOver={e => e.currentTarget.style.color = 'var(--gold)'}
                  onMouseOut={e => e.currentTarget.style.color = 'var(--sand-dark)'}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid rgba(212,175,55,0.06)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--sand-dark)', fontFamily: 'var(--font-headings)', letterSpacing: '0.12em' }}>
              CARVED IN EGYPT · © 2026 TJESA SUITE · ALL RIGHTS RESERVED
            </span>
            <div style={{ display: 'flex', gap: '6px', color: 'var(--gold)' }}>
              {[
                <QrCode size={14} key="qr" />,
                <BarChart3 size={14} key="charts" />,
                <Scroll size={14} key="forms" />
              ].map((icon, idx) => (
                <div key={idx} style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.7 }}>
                  {icon}
                </div>
              ))}
            </div>
          </div>
        </footer>
      </div>

      {/* ── DEVELOPER PORTAL MODAL ─────────────────────────────────────────────── */}
      {portalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(7,7,6,0.88)',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 9999, padding: '20px', animation: 'fadeIn 0.2s ease-out',
        }}>
          <div style={{
            background: 'var(--obsidian-mid)', border: '1px solid var(--gold)',
            borderRadius: '12px', maxWidth: '850px', width: '100%',
            boxShadow: '0 0 35px rgba(212,175,55,0.3), 0 20px 40px rgba(0,0,0,0.9)',
            position: 'relative', overflow: 'hidden', animation: 'scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <div style={{ height: '4px', background: 'var(--gold-gradient)' }} />
            <button onClick={() => setPortalOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--sand-dim)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            <div style={{ padding: '32px 24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '22px', color: 'var(--gold)', fontFamily: 'var(--font-headings)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Architect Portal Gateway</h3>
                <p style={{ fontSize: '12px', color: 'var(--sand-dark)', marginTop: '4px' }}>Manage database bindings and integrations with Tjesa</p>
              </div>
              {isLoading ? (
                <div style={{ padding: '40px 0' }}><EyeOfHorusLoader text="Aligning the Stars..." /></div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  <GlowingCard title="The Golden Portal" subtitle="Official OAuth 2.0 gateway linkage">
                    <p style={{ marginBottom: '24px', fontSize: '13px', lineHeight: 1.5, color: 'var(--sand-dim)', fontFamily: 'var(--font-body)' }}>Connect your workspaces officially via Notion OAuth.</p>
                    <a href={oauthUrl} className="kemet-btn" style={{ width: '100%', justifyContent: 'center', padding: '10px 0', fontSize: '12px', textDecoration: 'none' }}>
                      Open OAuth Gateway
                    </a>
                  </GlowingCard>
                  <GlowingCard title="The Secret Key" subtitle="Direct bind via internal secret token">
                    <form onSubmit={handleTokenSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <p style={{ marginBottom: '16px', fontSize: '13px', lineHeight: 1.5, color: 'var(--sand-dim)', fontFamily: 'var(--font-body)' }}>Paste your Notion internal integration token.</p>
                      <div style={{ marginBottom: '16px' }}>
                        <label className="kemet-label" htmlFor="secret-token" style={{ fontSize: '11px' }}>SECRET INTEGRATION KEY</label>
                        <input id="secret-token" className="kemet-input" type="password" placeholder="secret_HzLx..." value={token} onChange={(e) => setToken(e.target.value)} />
                      </div>
                      {error && (<div style={{ padding: '10px', background: 'rgba(168,36,36,0.08)', border: '1px solid var(--scarab-red)', borderRadius: '6px', color: '#FF7F7F', fontSize: '12px', marginBottom: '16px' }}>{error}</div>)}
                      <button type="submit" className="kemet-btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 'auto', padding: '9px 0', fontSize: '12px' }} disabled={!token}>Bind Secret Key</button>
                    </form>
                  </GlowingCard>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
