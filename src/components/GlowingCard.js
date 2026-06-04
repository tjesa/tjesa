import React from 'react';

export default function GlowingCard({ children, title, subtitle, className = '', style = {}, ...props }) {
  return (
    <div className={`kemet-card ${className}`} style={style} {...props}>
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
  );
}
