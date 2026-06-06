'use client';

import React, { useState, useEffect } from 'react';
import EyeOfHorusLoader from '../EyeOfHorusLoader';
import { AlertTriangle } from 'lucide-react';

const themeStyles = {
  egyptian_dark: {
    bodyBg: '#0D0D0B',
    bodyBgImage: 'radial-gradient(circle at 10% 20%, rgba(212, 175, 55, 0.05) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(30, 70, 138, 0.08) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(20, 19, 17, 0.95) 0%, #0D0D0B 100%)',
    textColor: 'var(--sand-light)',
    dimColor: 'var(--sand-dim)',
    darkColor: 'var(--sand-dark)',
    goldColor: 'var(--gold)',
    headingColor: 'var(--gold)',
    cardBg: 'var(--obsidian-card)',
    cardBorder: '1px solid rgba(212, 175, 55, 0.2)',
    dividerColor: 'rgba(212, 175, 55, 0.15)',
    btnBg: 'var(--gold-gradient)',
    btnTextColor: '#0D0D0B',
    fontHeadings: 'var(--font-headings), Cinzel, serif',
    fontBody: 'var(--font-body), Outfit, sans-serif',
    cardShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
    tagBg: 'rgba(212, 175, 55, 0.08)',
    tagColor: 'var(--gold)',
    tagBorder: '1px solid rgba(212, 175, 55, 0.2)'
  },
  egyptian_light: {
    bodyBg: '#F5EFEB',
    bodyBgImage: 'radial-gradient(circle at 10% 20%, rgba(212, 175, 55, 0.04) 0%, transparent 45%), radial-gradient(circle at 90% 80%, rgba(13, 32, 64, 0.04) 0%, transparent 45%)',
    textColor: '#3A3225',
    dimColor: '#5C503D',
    darkColor: '#A38118',
    goldColor: '#8C6C1B',
    headingColor: '#4A3E2D',
    cardBg: '#FCFAF7',
    cardBorder: '1px solid rgba(170, 137, 40, 0.25)',
    dividerColor: 'rgba(170, 137, 40, 0.15)',
    btnBg: 'linear-gradient(135deg, #A38118 0%, #8C6C1B 100%)',
    btnTextColor: '#FFF',
    fontHeadings: 'var(--font-headings), Cinzel, serif',
    fontBody: 'var(--font-body), Outfit, sans-serif',
    cardShadow: '0 8px 24px rgba(74, 62, 45, 0.08)',
    tagBg: 'rgba(170, 137, 40, 0.06)',
    tagColor: '#8C6C1B',
    tagBorder: '1px solid rgba(170, 137, 40, 0.15)'
  },
  minimalist: {
    bodyBg: '#FCFCFC',
    bodyBgImage: 'none',
    textColor: '#222222',
    dimColor: '#666666',
    darkColor: '#999999',
    goldColor: '#111111',
    headingColor: '#111111',
    cardBg: '#FFFFFF',
    cardBorder: '1px solid #EAEAEA',
    dividerColor: '#EAEAEA',
    btnBg: '#111111',
    btnTextColor: '#FFF',
    fontHeadings: 'system-ui, -apple-system, sans-serif',
    fontBody: 'system-ui, -apple-system, sans-serif',
    cardShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
    tagBg: '#F3F3F3',
    tagColor: '#444444',
    tagBorder: '1px solid #EAEAEA'
  }
};

export default function PublicSiteClient({ configId }) {
  const [site, setSite] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSiteData() {
      try {
        const response = await fetch(`/api/tools/publisher/posts?config_id=${configId}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setSite(data.site);
          setPosts(data.posts || []);
        } else {
          setError(data.error || 'Failed to load blog publication.');
        }
      } catch (err) {
        setError('A connection disruption occurred while reading the scroll.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSiteData();
  }, [configId]);

  // Apply visual styling dynamically on body
  useEffect(() => {
    if (!site) return;
    const styles = themeStyles[site.theme] || themeStyles.egyptian_dark;
    
    document.body.style.backgroundColor = styles.bodyBg;
    document.body.style.backgroundImage = styles.bodyBgImage;
    document.body.style.color = styles.textColor;
    
    return () => {
      // restore defaults
      document.body.style.backgroundColor = '';
      document.body.style.backgroundImage = '';
      document.body.style.color = '';
    };
  }, [site]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0D0D0B'
      }}>
        <EyeOfHorusLoader text="Unrolling publication archives..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0D0D0B',
        padding: '24px'
      }}>
        <div style={{
          textAlign: 'center',
          border: '1px solid var(--scarab-red)',
          background: 'rgba(168, 36, 36, 0.05)',
          borderRadius: '12px',
          padding: '32px 20px',
          maxWidth: '450px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: '#FF7F7F' }}>
            <AlertTriangle size={36} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-headings)', color: 'var(--gold)', textTransform: 'uppercase', margin: '0 0 8px 0', fontSize: '16px', letterSpacing: '0.05em' }}>
            Publication Gateway Fault
          </h3>
          <p style={{ fontSize: '13px', color: '#FF7F7F', lineHeight: 1.5, margin: 0 }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  const styles = themeStyles[site?.theme] || themeStyles.egyptian_dark;
  const isEgyptian = site?.theme !== 'minimalist';

  return (
    <div style={{ 
      minHeight: '100vh', 
      fontFamily: styles.fontBody, 
      color: styles.textColor,
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* Site Header */}
      <header style={{
        borderBottom: `1px solid ${styles.dividerColor}`,
        padding: '60px 24px 40px',
        textAlign: 'center',
        position: 'relative'
      }}>
        {isEgyptian && <div className="hieroglyph-bg" />}
        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontFamily: styles.fontHeadings,
            color: styles.headingColor,
            fontSize: '42px',
            textTransform: 'uppercase',
            margin: '0 0 12px 0',
            letterSpacing: '0.08em',
            textShadow: isEgyptian ? '0 2px 4px rgba(0, 0, 0, 0.8)' : 'none'
          }}>
            {site.title}
          </h1>
          <p style={{
            fontSize: '16px',
            color: styles.dimColor,
            lineHeight: 1.6,
            margin: 0,
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            {site.description}
          </p>
        </div>
      </header>

      {/* Main Grid of Posts */}
      <main style={{
        flex: 1,
        maxWidth: '900px',
        width: '100%',
        margin: '0 auto',
        padding: '48px 24px',
        boxSizing: 'border-box'
      }}>
        {posts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 24px',
            border: `1px dashed ${styles.dividerColor}`,
            borderRadius: '12px',
            background: styles.cardBg
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.6 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <h3 style={{ fontSize: '18px', marginTop: '16px', color: styles.headingColor, fontFamily: styles.fontHeadings }}>
              CHAMBERS ARE EMPTY
            </h3>
            <p style={{ fontSize: '14px', color: styles.dimColor, marginTop: '8px' }}>
              No articles are currently published on this site.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '32px'
          }}>
            {posts.map(post => (
              <article 
                key={post.id}
                style={{
                  background: styles.cardBg,
                  border: styles.cardBorder,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: styles.cardShadow,
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease, border-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  if (site.theme === 'egyptian_dark') {
                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.45)';
                  } else if (site.theme === 'egyptian_light') {
                    e.currentTarget.style.borderColor = 'rgba(170, 137, 40, 0.5)';
                  } else {
                    e.currentTarget.style.borderColor = '#111111';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = styles.cardBorder.split(' 1px ')[1] || styles.cardBorder;
                }}
              >
                {/* Cover Image */}
                {post.cover && (
                  <div style={{ width: '100%', height: '240px', overflow: 'hidden', position: 'relative' }}>
                    <img 
                      src={post.cover} 
                      alt={post.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                )}

                {/* Content Area */}
                <div style={{ padding: '32px' }}>
                  
                  {/* Date and Tags */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <span style={{ fontSize: '13px', color: styles.dimColor, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      {post.date}
                    </span>
                    {post.tags?.map((tag, idx) => (
                      <span key={idx} style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: styles.tagBg,
                        color: styles.tagColor,
                        border: styles.tagBorder,
                        fontFamily: styles.fontHeadings,
                        letterSpacing: '0.05em'
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Title */}
                  <h2 style={{
                    fontFamily: styles.fontHeadings,
                    color: styles.headingColor,
                    fontSize: '26px',
                    margin: '0 0 12px 0',
                    lineHeight: 1.3
                  }}>
                    <a href={`/sites/${configId}/${post.id}`} style={{
                      color: styles.headingColor,
                      textDecoration: 'none'
                    }}>
                      {post.title}
                    </a>
                  </h2>

                  {/* Excerpt */}
                  {post.excerpt && (
                    <p style={{
                      fontSize: '15px',
                      color: styles.dimColor,
                      lineHeight: 1.6,
                      margin: '0 0 20px 0'
                    }}>
                      {post.excerpt}
                    </p>
                  )}

                  {/* Read More Button */}
                  <a 
                    href={`/sites/${configId}/${post.id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: styles.btnBg,
                      color: styles.btnTextColor,
                      padding: '10px 20px',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      fontFamily: styles.fontHeadings,
                      letterSpacing: '0.05em',
                      boxShadow: site.theme === 'egyptian_dark' ? '0 4px 12px rgba(212, 175, 55, 0.15)' : 'none'
                    }}
                  >
                    Read Scroll ➔
                  </a>

                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${styles.dividerColor}`,
        padding: '32px 24px',
        textAlign: 'center',
        fontSize: '11px',
        color: styles.darkColor,
        letterSpacing: '0.15em',
        fontFamily: styles.fontHeadings
      }}>
        POWERED BY THE PAPYRUS PUBLISHER • TJESA INTEGRATED SUITE
      </footer>

    </div>
  );
}
