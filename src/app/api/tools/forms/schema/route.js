import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { getAccount } from '@/lib/db';

export async function GET(request) {
  // Retrieve workspace ID from cookies
  const workspaceId = request.cookies.get('tjesa_workspace_id')?.value;

  if (!workspaceId) {
    return NextResponse.json({ error: 'Unauthorized: No active gateway' }, { status: 401 });
  }

  const account = await getAccount(`${workspaceId}_forms`);

  if (!account || !account.access_token) {
    return NextResponse.json({ error: 'Workspace token not found' }, { status: 404 });
  }

  const notion = new Client({ auth: account.access_token });
  const { searchParams } = new URL(request.url);
  const databaseId = searchParams.get('database_id');

  if (!databaseId) {
    return NextResponse.json({ error: 'Missing database_id parameter' }, { status: 400 });
  }

  try {
    const database = await notion.dataSources.retrieve({ data_source_id: databaseId });
    const properties = database.properties || {};
    
    const mappableFields = [];

    Object.keys(properties).forEach(key => {
      const prop = properties[key];
      
      // We only support fields that map nicely to HTML form inputs
      const supportedTypes = [
        'title',
        'rich_text',
        'number',
        'checkbox',
        'select',
        'multi_select',
        'url',
        'email',
        'phone_number',
        'date'
      ];

      if (supportedTypes.includes(prop.type)) {
        let options = [];
        if (prop.type === 'select' && prop.select?.options) {
          options = prop.select.options.map(opt => opt.name);
        } else if (prop.type === 'multi_select' && prop.multi_select?.options) {
          options = prop.multi_select.options.map(opt => opt.name);
        } else if (prop.type === 'status' && prop.status?.options) {
          // Fallback just in case
          options = prop.status.options.map(opt => opt.name);
        }

        mappableFields.push({
          name: key,
          type: prop.type,
          options
        });
      }
    });

    return NextResponse.json({
      id: database.id,
      title: database.title?.[0]?.plain_text || database.name || 'Untitled Database',
      fields: mappableFields
    });
  } catch (error) {
    console.error('Notion API error (forms/schema):', error);
    return NextResponse.json({ error: 'Failed to retrieve Notion database schema: ' + error.message }, { status: 500 });
  }
}
