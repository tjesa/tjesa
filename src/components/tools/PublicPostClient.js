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

const getPostStyles = (theme) => {
  const isDark = theme === 'egyptian_dark';
  const isLight = theme === 'egyptian_light';
  const isMinimal = theme === 'minimalist';

  let quoteBg = 'rgba(212, 175, 55, 0.05)';
  let quoteBorder = 'var(--gold)';
  let calloutBg = 'rgba(255, 255, 255, 0.02)';
  let calloutBorder = 'rgba(212, 175, 55, 0.2)';
  let codeBg = '#141311';
  let codeColor = '#FFDF73';

  if (isLight) {
    quoteBg = 'rgba(170, 137, 40, 0.05)';
    quoteBorder = '#AA8928';
    calloutBg = 'rgba(0, 0, 0, 0.02)';
    calloutBorder = 'rgba(170, 137, 40, 0.25)';
    codeBg = '#FCFAF7';
    codeColor = '#4A3E2D';
  } else if (isMinimal) {
    quoteBg = '#FAF9F6';
    quoteBorder = '#111111';
    calloutBg = '#F8F8F8';
    calloutBorder = '#EAEAEA';
    codeBg = '#FAF9F6';
    codeColor = '#000000';
  }

  return `
    .kemet-post-content {
      line-height: 1.8;
      font-size: 16px;
    }
    .kemet-post-content p {
      margin-bottom: 20px;
    }
    .kemet-post-content h1,
    .kemet-post-content h2,
    .kemet-post-content h3 {
      margin-top: 36px;
      margin-bottom: 16px;
      font-weight: 700;
    }
    .kemet-post-content h1 { font-size: 32px; }
    .kemet-post-content h2 { font-size: 26px; }
    .kemet-post-content h3 { font-size: 20px; }
    
    .kemet-post-content blockquote {
      background: ${quoteBg};
      border-left: 4px solid ${quoteBorder};
      padding: 16px 20px;
      margin: 24px 0;
      font-style: italic;
      border-radius: 4px;
    }
    
    .kemet-post-content pre {
      background: ${codeBg};
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 24px 0;
      border: 1px solid ${calloutBorder};
    }
    
    .kemet-post-content code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 14px;
      color: ${codeColor};
    }
    
    .kemet-post-content ul,
    .kemet-post-content ol {
      margin-bottom: 24px;
      padding-left: 24px;
    }
    .kemet-post-content li {
      margin-bottom: 8px;
    }
    
    .kemet-post-image-wrapper {
      margin: 32px 0;
      text-align: center;
    }
    .kemet-post-image {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      border: 1px solid ${calloutBorder};
    }
    .kemet-post-image-caption {
      margin-top: 8px;
      font-size: 13px;
      color: #888;
      font-style: italic;
    }
    
    .kemet-callout {
      display: flex;
      gap: 16px;
      background: ${calloutBg};
      border: 1px solid ${calloutBorder};
      padding: 16px 20px;
      border-radius: 8px;
      margin: 24px 0;
    }
    .kemet-callout-icon {
      font-size: 20px;
      flex-shrink: 0;
    }
    .kemet-callout-content {
      flex: 1;
    }
    
    .kemet-todo {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }
    .kemet-todo-checkbox {
      width: 16px;
      height: 16px;
      cursor: not-allowed;
    }
    .kemet-todo-text {
      font-size: 16px;
    }
    
    .kemet-divider {
      border: 0;
      height: 1px;
      background: ${calloutBorder};
      margin: 40px 0;
    }
    
    .kemet-link {
      text-decoration: underline;
    }
  `;
};

export default function PublicPostClient({ configId, postId }) {
  const [site, setSite] = useState(null);
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPostData() {
      try {
        const response = await fetch(`/api/tools/publisher/post?config_id=${configId}&post_id=${postId}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setSite(data.site);
          setPost(data.post);
        } else {
          setError(data.error || 'Failed to load article content.');
        }
      } catch (err) {
        setError('A network disruption occurred while reading the scroll.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    loadPostData();
  }, [configId, postId]);

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
        <EyeOfHorusLoader text="Decrypting page blocks..." />
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
            Reading Chamber Fault
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
      
      {/* Dynamic Scoped CSS for Raw Notion block HTML */}
      <style dangerouslySetInnerHTML={{ __html: getPostStyles(site.theme) }} />

      {/* Navigation Header */}
      <nav style={{
        borderBottom: `1px solid ${styles.dividerColor}`,
        padding: '16px 24px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <a href={`/sites/${configId}`} style={{
            fontFamily: styles.fontHeadings,
            color: styles.headingColor,
            fontSize: '14px',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 'bold'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Back to {site.title}
          </a>
          
          <span style={{
            fontSize: '11px',
            color: styles.darkColor,
            fontFamily: styles.fontHeadings,
            letterSpacing: '0.1em'
          }}>
            THE PAPYRUS GENERATOR
          </span>
        </div>
      </nav>

      {/* Cover Banner */}
      {post.cover && (
        <div style={{ width: '100%', height: '350px', overflow: 'hidden', position: 'relative' }}>
          <img 
            src={post.cover} 
            alt={post.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: site.theme === 'egyptian_dark' ? 'linear-gradient(to bottom, transparent 30%, #0D0D0B 100%)' : 'none'
          }} />
        </div>
      )}

      {/* Main Post Container */}
      <main style={{
        flex: 1,
        maxWidth: '800px',
        width: '100%',
        margin: '0 auto',
        padding: '40px 24px 80px',
        boxSizing: 'border-box'
      }}>
        
        {/* Article Metadata */}
        <div style={{ marginBottom: '40px', borderBottom: `1px solid ${styles.dividerColor}`, paddingBottom: '32px' }}>
          {/* Tags */}
          {post.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {post.tags.map((tag, idx) => (
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
          )}

          {/* Title */}
          <h1 style={{
            fontFamily: styles.fontHeadings,
            color: styles.headingColor,
            fontSize: '38px',
            textTransform: 'uppercase',
            margin: '0 0 16px 0',
            lineHeight: 1.25,
            letterSpacing: '0.04em'
          }}>
            {post.title}
          </h1>

          {/* Date */}
          <span style={{ fontSize: '14px', color: styles.dimColor, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Published on {post.date}
          </span>
        </div>

        {/* Dynamic HTML Content Rendered from blocks */}
        <div 
          className="kemet-post-content"
          dangerouslySetInnerHTML={{ __html: post.htmlBody }}
        />

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
