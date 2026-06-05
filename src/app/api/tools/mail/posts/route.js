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

    if (config.tool !== 'mail_dispatcher') {
      return NextResponse.json({ error: 'Invalid config type' }, { status: 400 });
    }

    // 2. Fetch Notion token
    let account = await getAccount(config.workspace_id);
    if (!account) {
      const baseWorkspaceId = config.workspace_id.replace('_mail', '');
      account = await getAccount(baseWorkspaceId);
    }

    if (!account || !account.access_token) {
      return NextResponse.json({ error: 'Notion connection credentials not found' }, { status: 404 });
    }

    const settings = config.settings || {};
    const { column_email, column_name, column_status } = settings;

    // 3. Query Notion database
    const notion = new Client({ auth: account.access_token });
    const databaseId = config.database_id;

    let hasMore = true;
    let startCursor = undefined;
    const allPages = [];

    // Query up to 300 rows
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

    // 4. Parse pages
    const contacts = allPages.map(page => {
      const props = page.properties || {};

      // Resolve Name
      let name = 'Unnamed Contact';
      if (column_name && props[column_name]) {
        const p = props[column_name];
        if (p.type === 'title') {
          name = p.title?.map(t => t.plain_text).join('') || 'Unnamed Contact';
        } else if (p.type === 'rich_text') {
          name = p.rich_text?.map(t => t.plain_text).join('') || 'Unnamed Contact';
        }
      } else {
        // Find default title column if not explicitly mapped
        const titleKey = Object.keys(props).find(k => props[k].type === 'title');
        if (titleKey) {
          name = props[titleKey]?.title?.map(t => t.plain_text).join('') || 'Unnamed Contact';
        }
      }

      // Resolve Email
      let email = '';
      if (column_email && props[column_email]) {
        const p = props[column_email];
        if (p.type === 'email') {
          email = p.email || '';
        } else if (p.type === 'url') {
          email = p.url || '';
        } else if (p.type === 'rich_text') {
          email = p.rich_text?.map(t => t.plain_text).join('') || '';
        }
      } else {
        // Fallback: look for any email type column or any column named 'email'
        const emailKey = Object.keys(props).find(k => props[k].type === 'email' || k.toLowerCase() === 'email');
        if (emailKey) {
          const p = props[emailKey];
          email = p.type === 'email' ? p.email : p.rich_text?.map(t => t.plain_text).join('') || '';
        }
      }

      // Resolve Sent Status
      let isSent = false;
      if (column_status && props[column_status]) {
        const p = props[column_status];
        if (p.type === 'checkbox') {
          isSent = p.checkbox === true;
        } else if (p.type === 'select') {
          isSent = p.select?.name === settings.status_sent_value;
        } else if (p.type === 'status') {
          isSent = p.status?.name === settings.status_sent_value;
        } else if (p.type === 'rich_text') {
          const text = p.rich_text?.map(t => t.plain_text).join('') || '';
          isSent = text === settings.status_sent_value;
        }
      }

      return {
        id: page.id,
        name,
        email,
        isSent
      };
    });

    return NextResponse.json({
      success: true,
      contacts
    });
  } catch (error) {
    console.error('Error fetching Mail contacts:', error);
    return NextResponse.json({ error: 'Failed to retrieve contacts: ' + error.message }, { status: 500 });
  }
}
