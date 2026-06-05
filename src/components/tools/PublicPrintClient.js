'use client';

import React, { useEffect } from 'react';

export default function PublicPrintClient({
  pageSize = 'A4',
  orientation = 'portrait',
  margins = 'standard',
  cover,
  title,
  createdDate,
  htmlBody,
  configId
}) {
  
  useEffect(() => {
    // Automatically trigger browser print dialog after content is mounted
    const timer = setTimeout(() => {
      window.print();
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  let marginValue = '20mm';
  if (margins === 'narrow') {
    marginValue = '10mm';
  } else if (margins === 'none') {
    marginValue = '0mm';
  }

  const layoutStyles = `
    @page {
      size: ${pageSize} ${orientation};
      margin: ${marginValue};
    }
    
    body {
      background: #0D0D0B;
      margin: 0;
      padding: 0;
      color: #F2E3C9;
      font-family: 'Outfit', 'Arial', sans-serif;
    }

    .preview-container {
      min-height: 100vh;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      background-color: #0D0D0B;
      background-image: 
        radial-gradient(circle at 10% 20%, rgba(212, 175, 55, 0.03) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(30, 70, 138, 0.05) 0%, transparent 50%);
    }

    .control-bar {
      width: 100%;
      max-width: 800px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(20, 19, 17, 0.85);
      border: 1px solid rgba(212, 175, 55, 0.25);
      border-radius: 8px;
      padding: 12px 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    }

    .control-title-wrapper {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
    }

    .control-tag {
      font-size: 10px;
      color: #D4AF37;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      font-weight: 700;
    }

    .control-title {
      font-size: 14px;
      font-weight: 600;
      color: #F2E3C9;
    }

    .btn-group {
      display: flex;
      gap: 12px;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      font-size: 12px;
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .action-btn-primary {
      background: linear-gradient(135deg, #D4AF37 0%, #AA8928 100%);
      color: #0D0D0B;
      border: none;
      box-shadow: 0 2px 10px rgba(212, 175, 55, 0.2);
    }

    .action-btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);
    }

    .action-btn-secondary {
      background: transparent;
      color: #D4AF37;
      border: 1px solid rgba(212, 175, 55, 0.3);
    }

    .action-btn-secondary:hover {
      background: rgba(212, 175, 55, 0.08);
      border-color: #D4AF37;
    }

    .document-sheet {
      background: #ffffff;
      color: #222222;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
      border-radius: 4px;
      box-sizing: border-box;
      width: 100%;
      max-width: 800px;
      padding: ${margins === 'narrow' ? '10mm' : margins === 'none' ? '0mm' : '20mm'};
      min-height: 297mm;
      position: relative;
      font-size: 15px;
      line-height: 1.6;
    }

    .doc-title {
      font-family: 'Cinzel', 'Times New Roman', serif;
      font-size: 32px;
      color: #111111;
      margin-top: 0;
      margin-bottom: 8px;
      border-bottom: 2px solid #D4AF37;
      padding-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .doc-meta {
      font-size: 12px;
      color: #666666;
      margin-bottom: 32px;
      display: flex;
      gap: 16px;
    }

    .doc-cover {
      width: 100%;
      max-height: 280px;
      object-fit: cover;
      margin-bottom: 24px;
      border-radius: 4px;
      border: 1px solid #eaeaea;
    }

    .kemet-post-content {
      line-height: 1.8;
      font-size: 15px;
    }
    .kemet-post-content p {
      margin-bottom: 20px;
      color: #333333;
    }
    .kemet-post-content h1,
    .kemet-post-content h2,
    .kemet-post-content h3 {
      font-family: 'Cinzel', 'Times New Roman', serif;
      color: #111111;
      margin-top: 36px;
      margin-bottom: 16px;
      font-weight: 700;
      text-shadow: none;
    }
    .kemet-post-content h1 { font-size: 26px; }
    .kemet-post-content h2 { font-size: 22px; }
    .kemet-post-content h3 { font-size: 18px; }
    
    .kemet-post-content blockquote {
      background: #fdfaf3;
      border-left: 4px solid #D4AF37;
      padding: 16px 20px;
      margin: 24px 0;
      font-style: italic;
      border-radius: 4px;
      color: #444444;
    }
    
    .kemet-post-content pre {
      background: #f7f7f7;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 24px 0;
      border: 1px solid #e1e1e1;
    }
    
    .kemet-post-content code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
      color: #a82424;
    }
    
    .kemet-post-content ul,
    .kemet-post-content ol {
      margin-bottom: 24px;
      padding-left: 24px;
    }
    .kemet-post-content li {
      margin-bottom: 8px;
      color: #333333;
    }
    
    .kemet-post-image-wrapper {
      margin: 32px 0;
      text-align: center;
    }
    .kemet-post-image {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
      border: 1px solid #eaeaea;
    }
    .kemet-post-image-caption {
      margin-top: 8px;
      font-size: 13px;
      color: #777777;
      font-style: italic;
    }
    
    .kemet-callout {
      display: flex;
      gap: 16px;
      background: #f7f7f7;
      border: 1px solid #eaeaea;
      padding: 16px 20px;
      border-radius: 8px;
      margin: 24px 0;
    }
    .kemet-callout-icon {
      font-size: 20px;
      flex-shrink: 0;
      color: #D4AF37;
    }
    .kemet-callout-content {
      flex: 1;
      color: #444444;
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
      font-size: 15px;
      color: #333333;
    }
    
    .kemet-divider {
      border: 0;
      height: 1px;
      background: #eaeaea;
      margin: 40px 0;
    }
    
    .kemet-link {
      text-decoration: underline;
      color: #222222;
    }

    @media print {
      body, .preview-container {
        background: #ffffff !important;
        background-image: none !important;
        padding: 0 !important;
        color: #000000 !important;
      }

      .no-print {
        display: none !important;
      }

      .document-sheet {
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        margin: 0 !important;
        min-height: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        color: #000000 !important;
        background: #ffffff !important;
      }

      h1, h2, h3 {
        page-break-after: avoid !important;
      }

      pre, blockquote, .kemet-callout, figure {
        page-break-inside: avoid !important;
      }
    }
  `;

  return (
    <div className="preview-container">
      <style dangerouslySetInnerHTML={{ __html: layoutStyles }} />
      
      {/* Control bar for web view */}
      <div className="control-bar no-print">
        <div className="control-title-wrapper">
          <span className="control-tag">The Rosetta Press</span>
          <span className="control-title">Scroll Print Chamber</span>
        </div>
        <div className="btn-group">
          <a href="/dashboard/tools/pdf" className="action-btn action-btn-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Dashboard
          </a>
          <button onClick={() => window.print()} className="action-btn action-btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Print PDF
          </button>
        </div>
      </div>

      {/* The Printable Page Sheet */}
      <div className="document-sheet">
        {cover && (
          <img src={cover} alt={title} className="doc-cover" />
        )}
        
        <h1 className="doc-title">{title}</h1>
        
        <div className="doc-meta">
          <span>Date: {createdDate}</span>
          <span>Format: {pageSize} ({orientation})</span>
        </div>

        <div 
          className="kemet-post-content"
          dangerouslySetInnerHTML={{ __html: htmlBody }}
        />
      </div>
    </div>
  );
}
