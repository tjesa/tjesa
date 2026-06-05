import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { getAccount } from '@/lib/db';
import { pollAndSync } from '@/lib/poller';

export async function GET(request) {
  // Fire background poll & sync loop (non-blocking)
  pollAndSync().catch(err => console.error('[Tjesa Poller Trigger Error]:', err));

  // Retrieve workspace ID from cookies
  const workspaceId = request.cookies.get('tjesa_workspace_id')?.value;

  if (!workspaceId) {
    return NextResponse.json({ error: 'Unauthorized: No active gateway' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tool = searchParams.get('tool') || 'qr';
  let account = await getAccount(`${workspaceId}_${tool}`);
  if (!account) {
    account = await getAccount(workspaceId);
  }

  if (!account || !account.access_token) {
    return NextResponse.json({ error: `Notion connection for ${tool} not found` }, { status: 404 });
  }

  const notion = new Client({ auth: account.access_token });
  const databaseId = searchParams.get('database_id');

  try {
    if (databaseId) {
      // Fetch details of a specific data source to extract property schema
      const database = await notion.dataSources.retrieve({ data_source_id: databaseId });
      
      const properties = database.properties;
      const urlColumns = [];
      const fileColumns = [];
      const checkboxColumns = [];
      const selectColumns = [];

      const numberColumns = [];
      const dateColumns = [];

      // Categorize columns by their data types
      Object.keys(properties).forEach(key => {
        const prop = properties[key];
        // URLs can come from URL fields, Rich Text fields, or Title fields
        if (['url', 'rich_text', 'title'].includes(prop.type)) {
          urlColumns.push({ name: key, type: prop.type });
        }
        // QR Codes can be written into Files & Media fields (renders image) or Rich Text / URL fields (renders links)
        if (['files', 'rich_text', 'url'].includes(prop.type)) {
          fileColumns.push({ name: key, type: prop.type });
        }
        // Checkboxes for conditional trigger
        if (prop.type === 'checkbox') {
          checkboxColumns.push({ name: key, type: prop.type });
        }
        // Status or Select columns for conditional trigger
        if (['select', 'status', 'multi_select'].includes(prop.type)) {
          selectColumns.push({ name: key, type: prop.type });
        }
        // Numbers for aggregation
        if (prop.type === 'number') {
          numberColumns.push({ name: key, type: prop.type });
        }
        // Dates for groupings
        if (prop.type === 'date') {
          dateColumns.push({ name: key, type: prop.type });
        }
      });

      return NextResponse.json({
        id: database.id,
        title: database.title?.[0]?.plain_text || database.name || 'Untitled Sarcophagus',
        urlColumns,
        fileColumns,
        checkboxColumns,
        selectColumns,
        numberColumns,
        dateColumns
      });
    } else {
      // Search all databases shared with the integration
      const response = await notion.search({
        filter: {
          value: 'data_source',
          property: 'object'
        },
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time'
        }
      });

      const databases = response.results.map(db => ({
        id: db.id,
        title: db.title?.[0]?.plain_text || db.name || 'Untitled Sarcophagus',
        last_edited_time: db.last_edited_time,
        url: db.url
      }));

      return NextResponse.json({ databases });
    }
  } catch (error) {
    console.error('Notion API Error:', error);
    return NextResponse.json({ error: 'Failed to communicate with Notion API' }, { status: 500 });
  }
}
