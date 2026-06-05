import React, { useRef } from 'react';

export default function GlowingCard({ children, title, subtitle, className = '', style = {}, ...props }) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`kemet-card ${className}`} 
      style={{ ...style, position: 'relative', overflow: 'hidden' }} 
      {...props}
    >
      {/* Dynamic Cursor Spotlight Layer */}
      <div className="card-spotlight" />

      <div style={{ position: 'relative', zIndex: 2 }}>
        {title && (
          <div style={{ 
            marginBottom: '20px', 
            borderBottom: '1px solid rgba(212, 175, 55, 0.15)', 
            paddingBottom: '12px', 
            position: 'relative' 
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              textTransform: 'uppercase'
            }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{ 
                fontSize: '12px', 
                color: 'var(--sand-dim)', 
                marginTop: '4px', 
                letterSpacing: '0.02em' 
              }}>
                {subtitle}
              </p>
            )}
            {/* Pharaonic Decorative diamond dot on the border line */}
            <div style={{
              position: 'absolute',
              bottom: '-4px',
              left: '24px',
              width: '8px',
              height: '8px',
              background: 'var(--gold)',
              transform: 'rotate(45deg)',
              boxShadow: '0 0 8px var(--gold)'
            }} />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
