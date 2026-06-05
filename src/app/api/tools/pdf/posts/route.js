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

    if (config.tool !== 'pdf_exporter') {
      return NextResponse.json({ error: 'Invalid configuration tool type' }, { status: 400 });
    }

    // 2. Fetch the Notion account credentials
    let account = await getAccount(config.workspace_id);
    if (!account) {
      const baseWorkspaceId = config.workspace_id.replace('_pdf', '');
      account = await getAccount(baseWorkspaceId);
    }

    if (!account || !account.access_token) {
      return NextResponse.json({ error: 'Notion connection credentials not found' }, { status: 404 });
    }

    // 3. Initialize Notion client
    const notion = new Client({ auth: account.access_token });
    const databaseId = config.database_id;

    // 4. Query pages (fetch up to 100 pages for export list)
    const response = await notion.dataSources.query({
      data_source_id: databaseId,
      page_size: 100
    });

    const pages = response.results.map(page => {
      const props = page.properties || {};

      // Find the title property dynamically
      const titleKey = Object.keys(props).find(k => props[k].type === 'title');
      const titleProp = titleKey ? props[titleKey] : null;
      const title = titleProp?.title?.map(t => t.plain_text).join('') || 'Untitled Document';

      return {
        id: page.id,
        title
      };
    });

    return NextResponse.json({
      success: true,
      pages
    });
  } catch (error) {
    console.error('Error fetching PDF pages list:', error);
    return NextResponse.json({ error: 'Failed to retrieve pages: ' + error.message }, { status: 500 });
  }
}
