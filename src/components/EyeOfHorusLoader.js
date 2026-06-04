import React from 'react';

export default function EyeOfHorusLoader({ size = 80, text = "Invoking the Scribes..." }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      gap: '16px'
    }}>
      <div className="animate-eye" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          {/* Eyebrow */}
          <path 
            d="M15 32 Q 50 12, 85 32 Q 50 22, 15 32" 
            fill="var(--gold)" 
          />
          {/* Outer Eye */}
          <path 
            d="M10 50 Q 50 22, 90 50 Q 50 78, 10 50 Z" 
            fill="rgba(212, 175, 55, 0.05)" 
            stroke="var(--gold)" 
            strokeWidth="4" 
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Pupil / Iris */}
          <circle 
            cx="50" 
            cy="50" 
            r="15" 
            fill="var(--obsidian-mid)" 
            stroke="var(--gold)" 
            strokeWidth="3" 
          />
          <circle 
            cx="48" 
            cy="48" 
            r="6" 
            fill="var(--gold-bright)" 
          />
          {/* Under-eye vertical bar (Talon) */}
          <path 
            d="M52 64 L 52 88" 
            stroke="var(--gold)" 
            strokeWidth="4" 
            strokeLinecap="round" 
          />
          {/* Under-eye spiral (Cheek mark) */}
          <path 
            d="M68 59 Q 62 80, 42 80 Q 30 80, 30 68 Q 30 58, 42 58 Q 50 58, 50 64" 
            fill="none" 
            stroke="var(--gold)" 
            strokeWidth="4" 
            strokeLinecap="round" 
          />
        </svg>
      </div>
      {text && (
        <span style={{
          fontFamily: 'var(--font-headings)',
          fontSize: '14px',
          color: 'var(--gold)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          textAlign: 'center',
          animation: 'goldenGlow 2s infinite ease-in-out'
        }}>
          {text}
        </span>
      )}
    </div>
  );
}
