import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { getAccount, getConfig } from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const configId = searchParams.get('config_id');

  if (!configId) {
    return NextResponse.json({ error: 'Missing configuration ID' }, { status: 400 });
  }

  try {
    // 1. Fetch the configuration
    const config = await getConfig(configId);
    if (!config) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    if (config.tool !== 'papyrus_publisher') {
      return NextResponse.json({ error: 'Invalid configuration tool type' }, { status: 400 });
    }

    // 2. Fetch the Notion account credentials
    let account = await getAccount(config.workspace_id);
    if (!account) {
      // Strip suffix as fallback
      const baseWorkspaceId = config.workspace_id.replace('_publisher', '');
      account = await getAccount(baseWorkspaceId);
    }

    if (!account || !account.access_token) {
      return NextResponse.json({ error: 'Notion connection credentials not found' }, { status: 404 });
    }

    const settings = config.settings || {};
    const {
      status_column: statusColumn,
      status_value: statusValue,
      date_column: dateColumn,
      slug_column: slugColumn
    } = settings;

    // 3. Initialize Notion client
    const notion = new Client({ auth: account.access_token });
    const databaseId = config.database_id;

    // 4. Query pages
    let hasMore = true;
    let startCursor = undefined;
    const allPages = [];

    // Query up to 300 pages to avoid timeouts while covering most blogs
    while (hasMore && allPages.length < 300) {
      const response = await notion.dataSources.query({
        data_source_id: databaseId,
        start_cursor: startCursor,
        page_size: 100
      });
      allPages.push(...response.results);
      hasMore = response.has_more;
      startCursor = response.next_cursor;
    }

    // 5. Parse and filter pages
    const posts = [];

    for (const page of allPages) {
      const props = page.properties || {};

      // A. Extract Title
      const titleKey = Object.keys(props).find(k => props[k].type === 'title');
      const titleProp = titleKey ? props[titleKey] : null;
      const title = titleProp?.title?.map(t => t.plain_text).join('') || 'Untitled Post';

      // B. Evaluate Status Filter
      let isPublished = false;
      if (statusColumn) {
        const statusProp = props[statusColumn];
        if (statusProp) {
          if (statusProp.type === 'status') {
            isPublished = (statusProp.status?.name === statusValue);
          } else if (statusProp.type === 'select') {
            isPublished = (statusProp.select?.name === statusValue);
          } else if (statusProp.type === 'multi_select') {
            isPublished = statusProp.multi_select?.some(s => s.name === statusValue);
          } else if (statusProp.type === 'checkbox') {
            const expectedBool = statusValue === 'true' || statusValue === 'Checked' || statusValue === true;
            isPublished = (statusProp.checkbox === expectedBool);
          }
        }
      } else {
        isPublished = true; // default if no status column mapped
      }

      if (!isPublished) continue;

      // C. Extract Slug
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
        // Fallback to title-based slug
        slug = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }

      // D. Extract Date
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

      // E. Extract Excerpt / Summary
      let excerpt = '';
      // Look for a property explicitly containing description / excerpt / summary keywords
      const excerptKey = Object.keys(props).find(k => {
        const lower = k.toLowerCase();
        return (lower.includes('excerpt') || lower.includes('summary') || lower.includes('description') || lower.includes('subtitle')) && props[k].type === 'rich_text';
      });
      if (excerptKey) {
        excerpt = props[excerptKey].rich_text?.map(t => t.plain_text).join('') || '';
      }

      // F. Extract Tags
      let tags = [];
      const tagsKey = Object.keys(props).find(k => props[k].type === 'multi_select');
      const tagsProp = props['Tags'] || props['tags'] || (tagsKey ? props[tagsKey] : null);
      if (tagsProp && tagsProp.type === 'multi_select') {
        tags = tagsProp.multi_select.map(t => t.name);
      }

      // G. Extract Cover
      let cover = '';
      if (page.cover) {
        cover = page.cover.external?.url || page.cover.file?.url || '';
      }
      if (!cover) {
        // Look for any files/media property that might contain an image
        const filesKey = Object.keys(props).find(k => props[k].type === 'files');
        if (filesKey) {
          const file = props[filesKey].files?.[0];
          if (file) {
            cover = file.external?.url || file.file?.url || '';
          }
        }
      }

      posts.push({
        id: page.id,
        title,
        slug,
        date,
        excerpt,
        tags,
        cover
      });
    }

    // 6. Sort posts by date descending
    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      success: true,
      site: {
        title: settings.site_title || 'The Papyrus Scroll',
        description: settings.site_description || '',
        theme: settings.theme || 'egyptian_dark'
      },
      posts
    });
  } catch (error) {
    console.error('Error fetching CMS posts:', error);
    return NextResponse.json({ error: 'Failed to retrieve posts: ' + error.message }, { status: 500 });
  }
}
