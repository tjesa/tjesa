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
    // 1. Fetch config
    const config = await getConfig(configId);
    if (!config) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    if (config.tool !== 'social_herald') {
      return NextResponse.json({ error: 'Invalid config type' }, { status: 400 });
    }

    // 2. Fetch Notion credentials
    let account = await getAccount(config.workspace_id);
    if (!account) {
      const baseWorkspaceId = config.workspace_id.replace('_social', '');
      account = await getAccount(baseWorkspaceId);
    }

    if (!account || !account.access_token) {
      return NextResponse.json({ error: 'Notion credentials not found' }, { status: 404 });
    }

    const settings = config.settings || {};
    const {
      column_caption,
      column_image,
      column_trigger,
      column_publish,
      column_date,
      trigger_value = 'Ready',
      status_published_value = 'Published'
    } = settings;

    // 3. Query Notion database
    const notion = new Client({ auth: account.access_token });
    const databaseId = config.database_id;

    let hasMore = true;
    let startCursor = undefined;
    const allPages = [];

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

    // 4. Parse posts
    const posts = allPages.map(page => {
      const props = page.properties || {};

      // Resolve Name
      let title = 'Untitled Post';
      const titleKey = Object.keys(props).find(k => props[k].type === 'title');
      if (titleKey) {
        title = props[titleKey]?.title?.map(t => t.plain_text).join('') || 'Untitled Post';
      }

      // Resolve Caption
      let caption = '';
      if (column_caption && props[column_caption]) {
        const p = props[column_caption];
        if (p.type === 'rich_text') {
          caption = p.rich_text?.map(t => t.plain_text).join('') || '';
        } else if (p.type === 'title') {
          caption = p.title?.map(t => t.plain_text).join('') || '';
        }
      }

      // Resolve Image
      let imageUrl = '';
      if (column_image && props[column_image]) {
        const p = props[column_image];
        if (p.type === 'files') {
          const file = p.files?.[0];
          if (file) {
            imageUrl = file.external?.url || file.file?.url || '';
          }
        }
      }

      // Resolve Trigger Condition
      let triggerMet = true;
      if (column_trigger && props[column_trigger]) {
        const p = props[column_trigger];
        if (p.type === 'checkbox') {
          triggerMet = p.checkbox === true;
        } else if (p.type === 'select') {
          triggerMet = p.select?.name === trigger_value;
        } else if (p.type === 'status') {
          triggerMet = p.status?.name === trigger_value;
        }
      }

      // Resolve Published Status
      let isPublished = false;
      if (column_publish && props[column_publish]) {
        const p = props[column_publish];
        if (p.type === 'checkbox') {
          isPublished = p.checkbox === true;
        } else if (p.type === 'select') {
          isPublished = p.select?.name === status_published_value;
        } else if (p.type === 'status') {
          isPublished = p.status?.name === status_published_value;
        }
      }

      // Resolve Published Date
      let publishDate = '';
      if (column_date && props[column_date]) {
        const p = props[column_date];
        if (p.type === 'date') {
          publishDate = p.date?.start || '';
        }
      }

      return {
        id: page.id,
        title,
        caption,
        imageUrl,
        triggerMet,
        isPublished,
        publishDate
      };
    });

    return NextResponse.json({
      success: true,
      posts
    });
  } catch (error) {
    console.error('Error fetching Social posts:', error);
    return NextResponse.json({ error: 'Failed to retrieve drafts: ' + error.message }, { status: 500 });
  }
}
