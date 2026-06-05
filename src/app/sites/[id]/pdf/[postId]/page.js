import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { Client } from '@notionhq/client';
import { getAccount, getConfig } from '@/lib/db';
import { validateGateSession } from '@/lib/gate';
import SphinxGateClient from '@/components/tools/SphinxGateClient';
import PublicPrintClient from '@/components/tools/PublicPrintClient';

// Rich text render helper
function renderRichText(richTextArray) {
  if (!richTextArray || richTextArray.length === 0) return '';
  return richTextArray.map(item => {
    let text = item.plain_text;
    
    // Escape HTML special characters
    text = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const { bold, italic, strikethrough, underline, code } = item.annotations || {};

    if (code) text = `<code>${text}</code>`;
    if (bold) text = `<strong>${text}</strong>`;
    if (italic) text = `<em>${text}</em>`;
    if (strikethrough) text = `<del>${text}</del>`;
    if (underline) text = `<u>${text}</u>`;
    
    if (item.href) {
      text = `<a href="${item.href}" target="_blank" rel="noopener noreferrer" class="kemet-link">${text}</a>`;
    }
    
    return text;
  }).join('');
}

// Convert blocks into semantic HTML string
function parseBlocksToHtml(blocks) {
  let html = '';
  let inUl = false;
  let inOl = false;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const { type } = block;

    // List logic checks
    if (type === 'bulleted_list_item') {
      if (inOl) {
        html += '</ol>\n';
        inOl = false;
      }
      if (!inUl) {
        html += '<ul class="kemet-post-list kemet-post-ul">\n';
        inUl = true;
      }
      html += `  <li>${renderRichText(block.bulleted_list_item.rich_text)}</li>\n`;
    } else if (type === 'numbered_list_item') {
      if (inUl) {
        html += '</ul>\n';
        inUl = false;
      }
      if (!inOl) {
        html += '<ol class="kemet-post-list kemet-post-ol">\n';
        inOl = true;
      }
      html += `  <li>${renderRichText(block.numbered_list_item.rich_text)}</li>\n`;
    } else {
      // Close open list tags
      if (inUl) {
        html += '</ul>\n';
        inUl = false;
      }
      if (inOl) {
        html += '</ol>\n';
        inOl = false;
      }

      // Parse current block type
      if (type === 'paragraph') {
        const text = renderRichText(block.paragraph.rich_text);
        if (text) {
          html += `<p class="kemet-post-paragraph">${text}</p>\n`;
        } else {
          // Empty paragraph acts as a line break
          html += `<br class="kemet-post-br" />\n`;
        }
      } else if (type === 'heading_1') {
        html += `<h1 class="kemet-post-h1">${renderRichText(block.heading_1.rich_text)}</h1>\n`;
      } else if (type === 'heading_2') {
        html += `<h2 class="kemet-post-h2">${renderRichText(block.heading_2.rich_text)}</h2>\n`;
      } else if (type === 'heading_3') {
        html += `<h3 class="kemet-post-h3">${renderRichText(block.heading_3.rich_text)}</h3>\n`;
      } else if (type === 'quote') {
        html += `<blockquote class="kemet-post-quote">${renderRichText(block.quote.rich_text)}</blockquote>\n`;
      } else if (type === 'code') {
        const codeText = block.code.rich_text?.map(t => t.plain_text).join('') || '';
        const language = block.code.language || 'plaintext';
        html += `<pre class="kemet-post-code-block"><code class="language-${language}">${escapeHtml(codeText)}</code></pre>\n`;
      } else if (type === 'image') {
        const url = block.image.external?.url || block.image.file?.url || '';
        const caption = block.image.caption?.map(t => t.plain_text).join('') || '';
        if (url) {
          html += `
            <figure class="kemet-post-image-wrapper">
              <img src="${url}" alt="${caption || 'Image from Notion'}" class="kemet-post-image" />
              ${caption ? `<figcaption class="kemet-post-image-caption">${caption}</figcaption>` : ''}
            </figure>\n
          `;
        }
      } else if (type === 'callout') {
        html += `
          <div class="kemet-callout">
            <div class="kemet-callout-icon" style="display: flex; align-items: center; justify-content: center; height: 100%;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>
            <div class="kemet-callout-content">${renderRichText(block.callout.rich_text)}</div>
          </div>\n
        `;
      } else if (type === 'to_do') {
        const checked = block.to_do.checked;
        html += `
          <div class="kemet-todo">
            <input type="checkbox" disabled ${checked ? 'checked' : ''} class="kemet-todo-checkbox" />
            <span class="kemet-todo-text">${renderRichText(block.to_do.rich_text)}</span>
          </div>\n
        `;
      } else if (type === 'divider') {
        html += `<hr class="kemet-divider" />\n`;
      }
    }
  }

  // Close lists if still open
  if (inUl) html += '</ul>\n';
  if (inOl) html += '</ol>\n';

  return html;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default async function PdfPrintPage({ params }) {
  const { id, postId } = await params;

  if (!id || !postId) {
    notFound();
  }

  // 1. Retrieve PDF config
  const config = await getConfig(id);

  if (!config || !config.active || config.tool !== 'pdf_exporter') {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0D0B', color: '#F2E3C9', padding: '24px' }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '500px',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          borderRadius: '12px',
          padding: '40px 24px',
          background: 'rgba(20, 19, 17, 0.75)',
          boxShadow: '0 0 20px rgba(212, 175, 55, 0.1)'
        }}>
          <h1 style={{ fontFamily: 'Cinzel, Times New Roman, serif', color: '#D4AF37', fontSize: '24px', marginBottom: '16px' }}>
            PORTAL INACCESSIBLE
          </h1>
          <p style={{ color: '#C2A67D', fontSize: '14px', lineHeight: 1.6 }}>
            This document press gateway is inactive or has been dissolved by the architect.
          </p>
          <a 
            href="/" 
            style={{ 
              display: 'inline-block', 
              marginTop: '24px', 
              color: '#D4AF37', 
              textDecoration: 'none', 
              fontWeight: 'bold', 
              fontSize: '13px',
              fontFamily: 'Cinzel, serif',
              letterSpacing: '0.05em',
              border: '1px solid #D4AF37',
              padding: '8px 24px',
              borderRadius: '4px',
              transition: 'all 0.3s ease'
            }}
          >
            Return to Sanctuary
          </a>
        </div>
      </main>
    );
  }

  // 2. Sphinx Shield Gate Check
  if (config.settings?.gate_active) {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(`tjesa_gate_session_${id}`)?.value;
    if (!validateGateSession(sessionToken, config)) {
      return (
        <main style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0D0B' }}>
          <SphinxGateClient configId={id} gateType={config.settings.gate_type} siteTitle={config.settings.pdf_title || config.database_name} />
        </main>
      );
    }
  }

  // 3. Fetch Notion access credentials
  let account = await getAccount(config.workspace_id);
  if (!account) {
    const baseWorkspaceId = config.workspace_id.replace('_pdf', '');
    account = await getAccount(baseWorkspaceId);
  }

  if (!account || !account.access_token) {
    notFound();
  }

  // 4. Initialize Notion client & fetch post details
  const notion = new Client({ auth: account.access_token });
  let page, blocks;
  
  try {
    page = await notion.pages.retrieve({ page_id: postId });
    
    // Fetch blocks
    blocks = [];
    let hasMoreBlocks = true;
    let startCursorBlocks = undefined;

    while (hasMoreBlocks && blocks.length < 500) {
      const blockResponse = await notion.blocks.children.list({
        block_id: postId,
        start_cursor: startCursorBlocks,
        page_size: 100
      });
      blocks.push(...blockResponse.results);
      hasMoreBlocks = blockResponse.has_more;
      startCursorBlocks = blockResponse.next_cursor;
    }
  } catch (err) {
    console.error('Notion fetch error in PDF render:', err);
    notFound();
  }

  const props = page.properties || {};
  const titleKey = Object.keys(props).find(k => props[k].type === 'title');
  const titleProp = titleKey ? props[titleKey] : null;
  const title = titleProp?.title?.map(t => t.plain_text).join('') || 'Untitled Document';

  // Cover image
  let cover = '';
  if (page.cover) {
    cover = page.cover.external?.url || page.cover.file?.url || '';
  }
  if (!cover) {
    const filesKey = Object.keys(props).find(k => props[k].type === 'files');
    if (filesKey) {
      const file = props[filesKey].files?.[0];
      if (file) {
        cover = file.external?.url || file.file?.url || '';
      }
    }
  }

  // Created time
  const createdDate = page.created_time ? page.created_time.substring(0, 10) : new Date().toISOString().substring(0, 10);

  const htmlBody = parseBlocksToHtml(blocks);

  // Print layout configs
  const pageSize = config.settings?.pdf_page_size || 'A4';
  const orientation = config.settings?.pdf_orientation || 'portrait';
  const margins = config.settings?.pdf_margins || 'standard';

  return (
    <PublicPrintClient
      pageSize={pageSize}
      orientation={orientation}
      margins={margins}
      cover={cover}
      title={title}
      createdDate={createdDate}
      htmlBody={htmlBody}
      configId={id}
    />
  );
}
