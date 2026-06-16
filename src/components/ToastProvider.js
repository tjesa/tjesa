'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { playSuccessSound, playErrorSound, playClickSound } from '@/lib/audio';

// ─── Context ───────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

// ─── Type Config ──────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  success: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    accent: '#34D399',
    bg: 'rgba(52, 211, 153, 0.08)',
    border: 'rgba(52, 211, 153, 0.25)',
    text: '#34D399',
    bar: '#34D399',
  },
  error: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    accent: '#FF7F7F',
    bg: 'rgba(168, 36, 36, 0.1)',
    border: 'rgba(168, 36, 36, 0.35)',
    text: '#FF9F9F',
    bar: '#A82424',
  },
  warning: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    accent: '#FBBF24',
    bg: 'rgba(251, 191, 36, 0.08)',
    border: 'rgba(251, 191, 36, 0.25)',
    text: '#FBBF24',
    bar: '#D97706',
  },
  info: {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    accent: '#D4AF37',
    bg: 'rgba(212, 175, 55, 0.08)',
    border: 'rgba(212, 175, 55, 0.25)',
    text: '#D4AF37',
    bar: '#AA8928',
  },
};

// ─── Single Toast Item ─────────────────────────────────────────────────────────
function ToastItem({ toast, onDismiss }) {
  const { id, message, type, duration } = toast;
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.info;
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef(null);
  const startRef = useRef(Date.now());

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(id), 320);
  }, [id, onDismiss]);

  useEffect(() => {
    const tick = 50;
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining === 0) {
        clearInterval(intervalRef.current);
        dismiss();
      }
    }, tick);
    return () => clearInterval(intervalRef.current);
  }, [duration, dismiss]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        minWidth: '280px',
        maxWidth: '380px',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderLeft: `3px solid ${cfg.accent}`,
        borderRadius: '10px',
        padding: '13px 14px 0',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        overflow: 'hidden',
        position: 'relative',
        animation: exiting
          ? 'toastSlideOut 0.32s cubic-bezier(0.4,0,1,1) both'
          : 'toastSlideIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
        cursor: 'pointer',
      }}
      onClick={dismiss}
      role="alert"
      aria-live="polite"
    >
      {/* Content row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, paddingBottom: '12px' }}>
        {/* Icon */}
        <span style={{
          color: cfg.accent,
          flexShrink: 0,
          marginTop: '1px',
          filter: `drop-shadow(0 0 6px ${cfg.accent}66)`,
        }}>
          {cfg.icon}
        </span>

        {/* Message */}
        <span style={{
          fontSize: '13px',
          color: cfg.text,
          lineHeight: 1.5,
          flex: 1,
          fontFamily: 'var(--font-body)',
          wordBreak: 'break-word',
        }}>
          {message}
        </span>

        {/* Dismiss X */}
        <button
          onClick={(e) => { e.stopPropagation(); dismiss(); }}
          style={{
            background: 'none',
            border: 'none',
            color: cfg.text,
            cursor: 'pointer',
            opacity: 0.5,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            transition: 'opacity 0.15s ease',
          }}
          onMouseOver={e => e.currentTarget.style.opacity = '1'}
          onMouseOut={e => e.currentTarget.style.opacity = '0.5'}
          aria-label="Dismiss"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: '2px',
        width: `${progress}%`,
        background: cfg.bar,
        transition: 'width 50ms linear',
        boxShadow: `0 0 6px ${cfg.bar}`,
      }} />
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    
    // Play thematic synthesized sound
    if (type === 'success') {
      playSuccessSound();
    } else if (type === 'error') {
      playErrorSound();
    } else if (type === 'warning') {
      playErrorSound();
    } else {
      playClickSound();
    }

    setToasts(prev => {
      // Keep max 5, drop oldest if over limit
      const next = [...prev, { id, message, type, duration }];
      return next.length > 5 ? next.slice(next.length - 5) : next;
    });
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container — fixed bottom-right, rendered as sibling to page content */}
      {toasts.length > 0 && (
        <div
          aria-label="Notifications"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            alignItems: 'flex-end',
            pointerEvents: 'none',
          }}
        >
          {toasts.map(toast => (
            <div key={toast.id} style={{ pointerEvents: 'all' }}>
              <ToastItem toast={toast} onDismiss={dismiss} />
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(32px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes toastSlideOut {
          from {
            opacity: 1;
            transform: translateX(0) scale(1);
            max-height: 120px;
            margin-bottom: 0;
          }
          to {
            opacity: 0;
            transform: translateX(32px) scale(0.92);
            max-height: 0;
            margin-bottom: -10px;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
