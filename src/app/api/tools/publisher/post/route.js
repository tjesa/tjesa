import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { getAccount, getConfig } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const configId = searchParams.get('config_id');
  const postId = searchParams.get('post_id');

  if (!configId || !postId) {
    return NextResponse.json({ error: 'Missing configuration ID or post ID' }, { status: 400 });
  }

  try {
    // 1. Fetch the configuration
    const config = await getConfig(configId);
    if (!config) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    // 2. Fetch the Notion account credentials
    let account = await getAccount(config.workspace_id);
    if (!account) {
      const baseWorkspaceId = config.workspace_id.replace('_publisher', '');
      account = await getAccount(baseWorkspaceId);
    }

    if (!account || !account.access_token) {
      return NextResponse.json({ error: 'Notion connection credentials not found' }, { status: 404 });
    }

    const settings = config.settings || {};
    const { date_column: dateColumn, slug_column: slugColumn } = settings;

    // 3. Initialize Notion client
    const notion = new Client({ auth: account.access_token });

    // 4. Retrieve Page Metadata
    const page = await notion.pages.retrieve({ page_id: postId });
    const props = page.properties || {};

    // A. Title
    const titleKey = Object.keys(props).find(k => props[k].type === 'title');
    const titleProp = titleKey ? props[titleKey] : null;
    const title = titleProp?.title?.map(t => t.plain_text).join('') || 'Untitled Post';

    // B. Date
    let date = '';
    if (dateColumn) {
      const dateProp = props[dateColumn];
      if (dateProp && dateProp.type === 'date') {
        date = dateProp.date?.start || '';
      }
    }
    if (!date) {
      date = page.created_time ? page.created_time.substring(0, 10) : new Date().toISOString().substring(0, 10);
    }

    // C. Slug
    let slug = '';
    if (slugColumn) {
      const slugProp = props[slugColumn];
      if (slugProp) {
        if (slugProp.type === 'url') {
          slug = slugProp.url || '';
        } else if (slugProp.type === 'rich_text') {
          slug = slugProp.rich_text?.map(t => t.plain_text).join('') || '';
        }
      }
    }
    slug = slug.trim().replace(/^\/+/g, '');
    if (!slug) {
      slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    // D. Cover
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

    // E. Tags
    let tags = [];
    const tagsKey = Object.keys(props).find(k => props[k].type === 'multi_select');
    const tagsProp = props['Tags'] || props['tags'] || (tagsKey ? props[tagsKey] : null);
    if (tagsProp && tagsProp.type === 'multi_select') {
      tags = tagsProp.multi_select.map(t => t.name);
    }

    // 5. Retrieve Page Block Children (The Post Body)
    let blocks = [];
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

    // 6. Convert Blocks to HTML
    const htmlBody = parseBlocksToHtml(blocks);

    return NextResponse.json({
      success: true,
      site: {
        title: settings.site_title || 'The Papyrus Scroll',
        description: settings.site_description || '',
        theme: settings.theme || 'egyptian_dark'
      },
      post: {
        id: page.id,
        title,
        date,
        slug,
        cover,
        tags,
        htmlBody
      }
    });
  } catch (error) {
    console.error('Error fetching CMS post content:', error);
    return NextResponse.json({ error: 'Failed to retrieve post content: ' + error.message }, { status: 500 });
  }
}

// Helper to convert rich text array to HTML
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
