'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import GlowingCard from './GlowingCard';
import EyeOfHorusLoader from './EyeOfHorusLoader';

// ─── Data ─────────────────────────────────────────────────────────────────────
const INSTRUMENTS = [
  { id: 'forms', name: 'The Nile Scribe', subtitle: 'NOTION FORMS & SURVEYS', emoji: '📜', status: 'live', description: 'Configure public-facing themed survey forms that map directly to Notion columns. Replies instantly create new rows in your database.' },
  { id: 'qr', name: 'The Glyph Carver', subtitle: 'QR CODE GENERATOR', emoji: '◫', status: 'live', description: 'Translate URLs in Notion columns into custom-colored, brandable QR Code images. Supports instant button triggers and automation.' },
  { id: 'charts', name: 'The Aten Gazer', subtitle: 'CHARTS OBSERVATORY', emoji: '☀️', status: 'live', description: 'Transform dry Notion data columns into interactive charts — bar, pie, line — to track tasks, finances, or project progress.' },
  { id: 'publisher', name: 'The Papyrus Publisher', subtitle: 'NOTION CMS & BLOGS', emoji: '📖', status: 'live', description: 'Publish blog posts and public-facing web pages directly from Notion database entries. Your CMS lives inside Notion.' },
  { id: 'pdf', name: 'The Rosetta Press', subtitle: 'PDF & DOCUMENT EXPORTER', emoji: '🗒️', status: 'live', description: 'Export Notion pages and database records as beautifully formatted PDF documents with custom branding and layout options.' },
  { id: 'mail', name: 'The Nile Dispatch', subtitle: 'EMAIL CAMPAIGNS', emoji: '✉️', status: 'coming-soon', description: 'Send branded email campaigns driven entirely by your Notion database. Write in Notion, dispatch to your subscribers.' },
  { id: 'social', name: 'The Royal Herald', subtitle: 'SOCIAL AUTO-DISPATCH', emoji: '📣', status: 'coming-soon', description: 'Schedule and publish social posts automatically from Notion. One database, all your social channels synchronized.' },
  { id: 'sphinx', name: 'The Sphinx Shield', subtitle: 'PORTAL SECURITY & VAULTS', emoji: '🏛️', status: 'live', description: 'Password-protect any public-facing TJESA output with a secure gate. Control who enters each portal you create.' },
];

const STEPS = [
  {
    number: '01', title: 'Connect Notion', description: 'Authorize TJESA to securely access your Notion workspace via OAuth. One click — no API keys to manage.',
    icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933z"/></svg>),
  },
  {
    number: '02', title: 'Configure Your Tool', description: 'Pick a database, map your columns, and style your output. Each instrument has a powerful configuration panel.',
    icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>),
  },
  {
    number: '03', title: 'Publish & Share', description: 'Get a shareable public link, embed code, or automated trigger. Your Notion data is now live for the world.',
    icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>),
  },
];

const TESTIMONIALS = [
  { quote: "TJESA replaced three separate tools I was paying for. My Notion database now powers our entire public-facing site — blog, forms, and all.", author: 'Layla M.', role: 'Product Manager', avatar: 'L' },
  { quote: "The QR code generator alone saved me 4 hours a week. My entire product catalog syncs automatically — I just update Notion.", author: 'Karim A.', role: 'E-commerce Founder', avatar: 'K' },
  { quote: "We publish client reports as PDFs straight from Notion. What used to take a day of formatting now takes 10 minutes.", author: 'Nadia T.', role: 'Strategy Consultant', avatar: 'N' },
];

const PRICING_FEATURES = [
  { label: 'Connected Notion workspaces', free: '1', pro: 'Unlimited' },
  { label: 'Sacred Instruments (tools)', free: '6 of 8', pro: 'All 8' },
  { label: 'Public pages / links', free: '5 active', pro: 'Unlimited' },
  { label: 'Email campaign sends/mo', free: '—', pro: '10,000' },
  { label: 'Custom domain mapping', free: '—', pro: '✓' },
  { label: 'Sphinx Shield password gates', free: '2', pro: 'Unlimited' },
  { label: 'Priority support', free: '—', pro: '✓' },
  { label: 'Remove TJESA branding', free: '—', pro: '✓' },
];

const FAQS = [
  { q: 'Do I need to know how to code?', a: 'Not a single line. TJESA connects to Notion via official OAuth and does all the heavy lifting. You configure through a visual dashboard, and your outputs are live immediately.' },
  { q: 'Does it work with any Notion plan?', a: 'Yes — TJESA works with any Notion plan (Free, Plus, Business, or Enterprise). You only need to share the specific databases you want to use with TJESA.' },
  { q: 'How is my Notion data kept secure?', a: 'TJESA requests read-only access to only the databases you explicitly share. We never store your actual Notion content — only configuration metadata. Your data lives in Notion.' },
  { q: 'What happens when I update a database in Notion?', a: 'Most tools (QR codes, charts, publisher) automatically reflect Notion changes in real-time or on the next page load. Forms write new rows directly into your database.' },
  { q: 'Can I use my own domain for public pages?', a: 'Custom domain mapping is available on the Pro plan. You can point any subdomain to your TJESA-powered pages and blogs.' },
];

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

// ─── FAQ Item ──────────────────────────────────────────────────────────────────
function FaqItem({ q, a, isOpen, onToggle }) {
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  return (
    <div style={{
      borderBottom: '1px solid rgba(212,175,55,0.08)',
      overflow: 'hidden',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left', gap: '16px',
        }}
      >
        <span style={{ fontSize: '15px', color: 'var(--sand-light)', fontFamily: 'var(--font-headings)', letterSpacing: '0.04em', lineHeight: 1.4 }}>
          {q}
        </span>
        <span style={{
          flexShrink: 0, width: '22px', height: '22px', borderRadius: '50%',
          border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--gold)', fontSize: '14px', transition: 'transform 0.3s ease, background 0.2s ease',
          transform: isOpen ? 'rotate(45deg)' : 'none',
          background: isOpen ? 'rgba(212,175,55,0.1)' : 'transparent',
        }}>+</span>
      </button>
      <div style={{ height: `${height}px`, transition: 'height 0.35s cubic-bezier(0.4,0,0.2,1)', overflow: 'hidden' }}>
        <div ref={contentRef} style={{ paddingBottom: '20px' }}>
          <p style={{ fontSize: '14px', color: 'var(--sand-dim)', lineHeight: 1.7, margin: 0 }}>{a}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function LandingClient({ oauthUrl }) {
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  // Waitlist States
  const [email, setEmail] = useState('');
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');

  // Portal Modal States
  const [portalOpen, setPortalOpen] = useState(false);
  const [token, setToken] = useState('');
  const [logoClicks, setLogoClicks] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      const sections = ['features', 'how-it-works', 'pricing', 'faq'];
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
      if (next >= 3) { triggerBypass(); return 0; }
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
    if (!email) return;
    setWaitlistLoading(true);
    setWaitlistError('');
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) { setWaitlistSuccess(true); setEmail(''); }
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
    { label: 'Features', id: 'features' },
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'Pricing', id: 'pricing' },
    { label: 'FAQ', id: 'faq' },
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
            <button onClick={() => router.push('/login')} className="landing-cta-secondary" style={{ padding: '8px 16px', fontSize: '11px' }}>Sign In</button>
            <button onClick={() => router.push('/signup')} className="landing-cta-primary" style={{ padding: '8px 18px', fontSize: '11px' }}>Get Started Free</button>
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
                NOW IN EARLY ACCESS — INSTRUMENTS ARE LIVE
              </div>
            </div>

            {/* Eyebrow */}
            <div className="section-label" style={{ marginBottom: '20px' }}>The Pharaonic Notion Suite</div>

            {/* Main title */}
            <h1 className="landing-hero-title" style={{
              fontSize: 'clamp(4.5rem, 12vw, 9rem)', fontFamily: 'var(--font-headings)',
              fontWeight: 700, letterSpacing: '0.22em', lineHeight: 0.9, marginBottom: '28px',
            }}>
              TJESA
            </h1>

            {/* Tagline */}
            <p style={{ fontSize: 'clamp(17px, 2.5vw, 22px)', color: 'var(--sand)', fontFamily: 'var(--font-headings)', letterSpacing: '0.04em', lineHeight: 1.4, marginBottom: '14px' }}>
              Eight Sacred Instruments.<br />One Notion Workspace.
            </p>

            <p style={{ fontSize: '15px', color: 'var(--sand-dim)', lineHeight: 1.75, maxWidth: '560px', margin: '0 auto 44px', fontFamily: 'var(--font-body)' }}>
              Generate forms, charts, QR codes, PDFs, emails, and blog posts — all driven directly from your Notion databases. No code. No extra platforms. No complexity.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => router.push('/signup')} className="landing-cta-primary" style={{ fontSize: '14px', padding: '15px 36px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" /></svg>
                Start Free — No Card Needed
              </button>
              <button onClick={() => scrollTo('features')} className="landing-cta-secondary">
                Explore Instruments
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              </button>
            </div>

            {/* Animated Stat Pills */}
            <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '56px' }}>
              {[
                { value: '8', label: 'Sacred Instruments' },
                { value: '420+', label: 'Architects Waiting' },
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
                {['📜 Notion Forms', '◫ QR Codes', '☀️ Live Charts', '📖 Blog CMS', '🗒️ PDF Export', '✉️ Email Campaigns', '📣 Social Dispatch', '🏛️ Portal Security'].map(item => (
                  <span key={item} style={{ fontSize: '12px', fontFamily: 'var(--font-headings)', letterSpacing: '0.12em', color: 'var(--sand-dark)', textTransform: 'uppercase' }}>
                    {item}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── INSTRUMENTS / FEATURES SECTION ──────────────────────────────────── */}
        <section id="features" style={{ padding: '100px 32px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div className="section-label" style={{ marginBottom: '16px' }}>Sacred Instruments</div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', margin: '0 0 16px', letterSpacing: '0.12em' }}>
              Eight Tools. One Workspace.
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--sand-dim)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>
              Each instrument connects directly to your Notion databases — no middleware, no complexity, no extra monthly tools.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {INSTRUMENTS.map((inst, i) => (
              <GlowingCard key={inst.id} className="instrument-card" style={{ animationDelay: `${i * 0.06}s` }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div className="instrument-emoji-wrap">{inst.emoji}</div>
                    <span className={inst.status === 'live' ? 'status-badge-live' : 'status-badge-coming'}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: inst.status === 'live' ? '#34D399' : 'var(--gold-dim)', display: 'inline-block' }} />
                      {inst.status === 'live' ? 'Live' : 'Soon'}
                    </span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', letterSpacing: '0.08em', margin: '0 0 3px', lineHeight: 1.2 }}>{inst.name}</h3>
                    <span style={{ fontSize: '9px', color: 'var(--gold-dim)', letterSpacing: '0.18em', fontFamily: 'var(--font-headings)' }}>{inst.subtitle}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--sand-dim)', lineHeight: 1.65, margin: 0, flex: 1, fontFamily: 'var(--font-body)' }}>{inst.description}</p>
                </div>
              </GlowingCard>
            ))}
          </div>
        </section>

        {/* ── FEATURE DEEP-DIVE STRIP ─────────────────────────────────────────── */}
        <section style={{
          padding: '80px 32px', width: '100%',
          background: 'linear-gradient(135deg, rgba(212,175,55,0.04) 0%, transparent 50%, rgba(30,70,138,0.05) 100%)',
          borderTop: '1px solid rgba(212,175,55,0.07)', borderBottom: '1px solid rgba(212,175,55,0.07)',
        }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '60px', alignItems: 'center' }}>
            {/* Left — Visual */}
            <div style={{ position: 'relative' }}>
              <div style={{
                background: 'var(--obsidian-card)', border: '1px solid rgba(212,175,55,0.15)',
                borderRadius: '16px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
              }}>
                <div style={{ height: '3px', background: 'var(--gold-gradient)' }} />
                <div style={{ padding: '20px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--gold)', fontFamily: 'var(--font-headings)', letterSpacing: '0.15em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34D399', display: 'inline-block' }} />
                    NOTION → TJESA LIVE SYNC
                  </div>
                  {[
                    { label: 'Product Catalog', rows: 148, tool: 'QR + Publisher', status: 'synced' },
                    { label: 'Customer Survey', rows: 312, tool: 'Nile Scribe Forms', status: 'synced' },
                    { label: 'Q2 Sales Report', rows: 67, tool: 'Aten Gazer Charts', status: 'synced' },
                    { label: 'Press Kit PDFs', rows: 23, tool: 'Rosetta Press', status: 'pending' },
                  ].map((row, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                      padding: '10px 12px', borderRadius: '8px', marginBottom: '6px',
                      background: i % 2 === 0 ? 'rgba(212,175,55,0.03)' : 'transparent',
                      border: '1px solid rgba(212,175,55,0.06)',
                    }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--sand-light)', fontFamily: 'var(--font-headings)', letterSpacing: '0.04em' }}>{row.label}</div>
                        <div style={{ fontSize: '10px', color: 'var(--sand-dark)', marginTop: '2px' }}>{row.rows} rows · {row.tool}</div>
                      </div>
                      <span style={{
                        fontSize: '9px', padding: '3px 8px', borderRadius: '20px', fontFamily: 'var(--font-headings)', letterSpacing: '0.08em',
                        background: row.status === 'synced' ? 'rgba(52,211,153,0.1)' : 'rgba(212,175,55,0.08)',
                        border: `1px solid ${row.status === 'synced' ? 'rgba(52,211,153,0.3)' : 'rgba(212,175,55,0.2)'}`,
                        color: row.status === 'synced' ? '#34D399' : 'var(--gold-dim)',
                      }}>
                        {row.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Glow behind card */}
              <div style={{ position: 'absolute', inset: '-20px', background: 'radial-gradient(ellipse at 50% 50%, rgba(212,175,55,0.06) 0%, transparent 70%)', zIndex: -1, borderRadius: '32px' }} />
            </div>

            {/* Right — Copy */}
            <div>
              <div className="section-label" style={{ justifyContent: 'flex-start', marginBottom: '20px' }}>Notion-First Workflow</div>
              <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', lineHeight: 1.2, letterSpacing: '0.08em', marginBottom: '20px' }}>
                Your Notion Database<br />Is Your CMS, CRM & More
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--sand-dim)', lineHeight: 1.8, marginBottom: '28px', fontFamily: 'var(--font-body)' }}>
                TJESA doesn't duplicate your data. Every instrument reads directly from your Notion databases and publishes in real-time. Edit a row in Notion — your public page updates instantly.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { icon: '⚡', text: 'Real-time sync — no manual exports' },
                  { icon: '🔒', text: 'Read-only access — your data never leaves Notion' },
                  { icon: '🌍', text: 'Public URLs generated automatically' },
                  { icon: '🎨', text: 'Egyptian-themed outputs, fully brandable' },
                ].map(item => (
                  <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ fontSize: '13px', color: 'var(--sand-dim)', fontFamily: 'var(--font-body)' }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
        <section id="how-it-works" style={{
          padding: '100px 32px', width: '100%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(212,175,55,0.025) 50%, transparent 100%)',
          borderTop: '1px solid rgba(212,175,55,0.06)', borderBottom: '1px solid rgba(212,175,55,0.06)',
        }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <div className="section-label" style={{ marginBottom: '16px' }}>The Sacred Process</div>
              <h2 style={{ fontSize: 'clamp(22px, 4vw, 36px)', margin: 0, letterSpacing: '0.12em' }}>Up & Running in 3 Minutes</h2>
              <p style={{ fontSize: '14px', color: 'var(--sand-dim)', marginTop: '12px', fontFamily: 'var(--font-body)' }}>No developer required. No complex setup. Just connect and configure.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '40px', position: 'relative' }}>
              {STEPS.map((step, i) => (
                <div key={step.number} style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '20px' }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        width: '72px', height: '72px', borderRadius: '20px',
                        background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.04))',
                        border: '1px solid rgba(212,175,55,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--gold)', boxShadow: '0 0 30px rgba(212,175,55,0.08)',
                      }}>
                        {step.icon}
                      </div>
                      <div style={{
                        position: 'absolute', top: '-10px', right: '-10px',
                        width: '26px', height: '26px', borderRadius: '50%',
                        background: 'var(--gold-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '10px', fontFamily: 'var(--font-headings)', fontWeight: 700, color: '#0D0D0B',
                      }}>
                        {i + 1}
                      </div>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '17px', letterSpacing: '0.08em', margin: '0 0 10px' }}>{step.title}</h3>
                      <p style={{ fontSize: '13px', color: 'var(--sand-dim)', lineHeight: 1.7, margin: 0, fontFamily: 'var(--font-body)' }}>{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ────────────────────────────────────────────────────── */}
        <section style={{ padding: '100px 32px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div className="section-label" style={{ marginBottom: '16px' }}>From the Scrolls</div>
            <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 34px)', margin: 0, letterSpacing: '0.12em' }}>
              What Architects Are Saying
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="testimonial-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                  {[...Array(5)].map((_, s) => <span key={s} style={{ color: 'var(--gold)', fontSize: '12px' }}>★</span>)}
                </div>
                <p style={{ fontSize: '14px', color: 'var(--sand-dim)', lineHeight: 1.75, margin: '0 0 20px', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
                  "{t.quote}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #D4AF37, #AA8928)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontFamily: 'var(--font-headings)', fontWeight: 700, color: '#0D0D0B',
                  }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--sand-light)', fontFamily: 'var(--font-headings)', letterSpacing: '0.04em' }}>{t.author}</div>
                    <div style={{ fontSize: '11px', color: 'var(--sand-dark)', marginTop: '2px' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PRICING ─────────────────────────────────────────────────────────── */}
        <section id="pricing" style={{
          padding: '100px 32px', width: '100%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(212,175,55,0.025) 50%, transparent 100%)',
          borderTop: '1px solid rgba(212,175,55,0.06)',
        }}>
          <div style={{ maxWidth: '860px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <div className="section-label" style={{ marginBottom: '16px' }}>Sacred Scrolls of Pricing</div>
              <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', margin: '0 0 12px', letterSpacing: '0.12em' }}>Simple, Honest Pricing</h2>
              <p style={{ fontSize: '14px', color: 'var(--sand-dim)', fontFamily: 'var(--font-body)' }}>Start free. Upgrade when your empire expands.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'start' }}>
              {/* Free Tier */}
              <div style={{
                background: 'var(--obsidian-card)', border: '1px solid rgba(212,175,55,0.12)',
                borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}>
                <div style={{ height: '3px', background: 'linear-gradient(90deg, rgba(212,175,55,0.4), rgba(212,175,55,0.1))' }} />
                <div style={{ padding: '32px 28px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--sand-dark)', fontFamily: 'var(--font-headings)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '10px' }}>Architect</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '42px', fontFamily: 'var(--font-headings)', color: 'var(--gold)', fontWeight: 700 }}>$0</span>
                    <span style={{ fontSize: '13px', color: 'var(--sand-dark)', fontFamily: 'var(--font-body)' }}>/month</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--sand-dim)', marginBottom: '28px', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
                    Everything you need to get started and explore all core instruments.
                  </p>
                  <button onClick={() => router.push('/signup')} className="landing-cta-secondary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                    Start for Free
                  </button>
                </div>
              </div>

              {/* Pro Tier */}
              <div className="pricing-card-pro" style={{
                background: 'linear-gradient(145deg, rgba(20,19,17,0.95), rgba(14,12,9,0.98))',
                border: '1px solid rgba(212,175,55,0.4)',
                borderRadius: '16px', overflow: 'hidden', position: 'relative',
              }}>
                <div style={{ height: '3px', background: 'var(--gold-gradient)' }} />
                <div style={{ position: 'absolute', top: '16px', right: '20px', padding: '4px 12px', borderRadius: '20px', background: 'var(--gold-gradient)', fontSize: '9px', fontFamily: 'var(--font-headings)', letterSpacing: '0.1em', color: '#0D0D0B', fontWeight: 700 }}>
                  MOST POPULAR
                </div>
                <div style={{ padding: '32px 28px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--gold)', fontFamily: 'var(--font-headings)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '10px' }}>Pharaoh</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '42px', fontFamily: 'var(--font-headings)', color: 'var(--gold)', fontWeight: 700 }}>$29</span>
                    <span style={{ fontSize: '13px', color: 'var(--sand-dark)', fontFamily: 'var(--font-body)' }}>/month</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--sand-dim)', marginBottom: '28px', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
                    Unlimited power. Custom domains. All 8 instruments unlocked.
                  </p>
                  <button onClick={() => scrollTo('waitlist-section')} className="landing-cta-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                    Join Waitlist for Pro
                  </button>
                </div>
              </div>
            </div>

            {/* Feature comparison table */}
            <div style={{
              marginTop: '40px', background: 'rgba(20,19,17,0.5)', border: '1px solid rgba(212,175,55,0.08)',
              borderRadius: '12px', overflow: 'hidden',
            }}>
              <div className="pricing-row" style={{ background: 'rgba(212,175,55,0.04)', padding: '12px 20px', borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
                <span style={{ fontSize: '10px', color: 'var(--sand-dark)', fontFamily: 'var(--font-headings)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Feature</span>
                <span style={{ fontSize: '10px', color: 'var(--sand-dark)', fontFamily: 'var(--font-headings)', letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center' }}>Free</span>
                <span style={{ fontSize: '10px', color: 'var(--gold)', fontFamily: 'var(--font-headings)', letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center' }}>Pro</span>
              </div>
              {PRICING_FEATURES.map((row, i) => (
                <div key={i} className="pricing-row" style={{ padding: '13px 20px', borderBottom: i < PRICING_FEATURES.length - 1 ? '1px solid rgba(212,175,55,0.05)' : 'none', background: i % 2 === 0 ? 'transparent' : 'rgba(212,175,55,0.01)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--sand-dim)', fontFamily: 'var(--font-body)' }}>{row.label}</span>
                  <span style={{ fontSize: '12px', color: 'var(--sand-dark)', fontFamily: 'var(--font-headings)', textAlign: 'center' }}>{row.free}</span>
                  <span style={{ fontSize: '12px', color: row.pro === '—' ? 'var(--sand-dark)' : 'var(--gold)', fontFamily: 'var(--font-headings)', textAlign: 'center' }}>{row.pro}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
        <section id="faq" style={{ padding: '100px 32px', maxWidth: '780px', margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div className="section-label" style={{ marginBottom: '16px' }}>Scrolls of Wisdom</div>
            <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 34px)', margin: 0, letterSpacing: '0.12em' }}>Frequently Asked Questions</h2>
          </div>
          <div style={{ background: 'rgba(20,19,17,0.5)', border: '1px solid rgba(212,175,55,0.08)', borderRadius: '14px', padding: '8px 28px' }}>
            {FAQS.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} isOpen={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
            ))}
          </div>
        </section>

        {/* ── WAITLIST / CTA SECTION ──────────────────────────────────────────── */}
        <section id="waitlist-section" style={{
          padding: '100px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(212,175,55,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px', width: '100%' }}>
            <div className="section-label" style={{ marginBottom: '20px' }}>Claim Your Place</div>
            <h2 style={{ fontSize: 'clamp(26px, 4.5vw, 42px)', marginBottom: '14px', letterSpacing: '0.12em' }}>
              Join 420+ Architects<br />in the Sacred Registry
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--sand-dim)', lineHeight: 1.75, marginBottom: '44px', fontFamily: 'var(--font-body)' }}>
              Be first when the gateway opens. Early access members receive priority onboarding and a locked-in founding rate.
            </p>

            {/* Waitlist Card */}
            <div style={{
              background: 'var(--obsidian-card)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(212,175,55,0.15)', borderRadius: '18px', padding: '40px 36px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 40px rgba(212,175,55,0.05)', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--gold-gradient)' }} />

              {waitlistSuccess ? (
                <div style={{ animation: 'fadeSlideUp 0.4s ease both', padding: '16px 0' }}>
                  <div style={{ fontSize: '44px', marginBottom: '18px' }}>✨</div>
                  <h3 style={{ fontFamily: 'var(--font-headings)', color: 'var(--gold)', fontSize: '20px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                    Carved in the Cartouche
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--sand-dim)', lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>
                    Your email is safely recorded. You will receive an exclusive notification the moment the gateway opens.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleWaitlistSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input
                      type="email" className="kemet-input" placeholder="your@email.com"
                      value={email} onChange={(e) => setEmail(e.target.value)} required
                      style={{ flex: 1, minWidth: '200px', fontSize: '14px' }}
                    />
                    <button type="submit" className="landing-cta-primary" disabled={waitlistLoading || !email} style={{ whiteSpace: 'nowrap', padding: '12px 24px' }}>
                      {waitlistLoading ? 'Carving...' : 'Reserve My Seat'}
                    </button>
                  </div>
                  {waitlistError && (
                    <div style={{ padding: '10px 14px', background: 'rgba(168,36,36,0.08)', border: '1px solid rgba(168,36,36,0.4)', borderRadius: '6px', color: '#FF7F7F', fontSize: '12px', textAlign: 'left' }}>
                      ⚠️ {waitlistError}
                    </div>
                  )}
                  <p style={{ fontSize: '11px', color: 'var(--sand-dark)', margin: 0, fontFamily: 'var(--font-body)' }}>
                    🔒 No spam. Unsubscribe anytime.
                  </p>
                </form>
              )}
            </div>

            <p style={{ marginTop: '22px', fontSize: '13px', color: 'var(--sand-dark)', fontFamily: 'var(--font-body)' }}>
              Already registered?{' '}
              <button
                onClick={() => router.push('/login')}
                style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontFamily: 'var(--font-headings)', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', padding: 0 }}
              >
                Enter Sanctuary →
              </button>
            </p>
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
                The Pharaonic Notion Suite. Eight sacred instruments, one workspace.
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
                { label: 'Features', action: () => scrollTo('features') },
                { label: 'How It Works', action: () => scrollTo('how-it-works') },
                { label: 'Pricing', action: () => scrollTo('pricing') },
                { label: 'FAQ', action: () => scrollTo('faq') },
                { label: 'Sign In', action: () => router.push('/login') },
                { label: 'Sign Up Free', action: () => router.push('/signup') },
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
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(item => (
                <div key={item} style={{ fontSize: '12px', color: 'var(--sand-dark)', marginBottom: '8px', fontFamily: 'var(--font-body)', cursor: 'pointer', transition: 'color 0.2s ease' }}
                  onMouseOver={e => e.currentTarget.style.color = 'var(--sand-dim)'} onMouseOut={e => e.currentTarget.style.color = 'var(--sand-dark)'}>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid rgba(212,175,55,0.06)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--sand-dark)', fontFamily: 'var(--font-headings)', letterSpacing: '0.12em' }}>
              CARVED IN EGYPT · © 2026 TJESA SUITE · ALL RIGHTS RESERVED
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['◫', '☀️', '📜'].map(icon => (
                <div key={icon} style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', opacity: 0.6 }}>{icon}</div>
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
