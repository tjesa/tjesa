import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { getConfig, getAccount, saveConfig } from '@/lib/db';

export async function POST(request) {
  try {
    const { configId, values } = await request.json();

    if (!configId) {
      return NextResponse.json({ error: 'Missing configId' }, { status: 400 });
    }

    if (!values || typeof values !== 'object') {
      return NextResponse.json({ error: 'Missing form field values' }, { status: 400 });
    }

    // 1. Fetch form configuration
    const config = await getConfig(configId);
    if (!config || !config.active || config.tool !== 'form_builder') {
      return NextResponse.json({ error: 'Active form configuration not found' }, { status: 404 });
    }

    // 2. Fetch workspace account details
    const account = await getAccount(config.workspace_id);
    if (!account || !account.access_token) {
      return NextResponse.json({ error: 'Workspace token not found' }, { status: 404 });
    }

    const settings = config.settings || {};
    const fields = settings.fields || [];
    const properties = {};

    // 3. Map form fields into Notion page properties
    for (const field of fields) {
      const val = values[field.column_name];

      // Handle required fields validation
      if (field.required && (val === undefined || val === null || val === '')) {
        return NextResponse.json({ 
          error: `Field "${field.field_label || field.column_name}" is required.` 
        }, { status: 400 });
      }

      // If value is empty, skip inserting it so Notion defaults apply
      if (val === undefined || val === null || val === '') {
        continue;
      }

      switch (field.column_type) {
        case 'title':
          properties[field.column_name] = {
            title: [
              {
                text: {
                  content: String(val)
                }
              }
            ]
          };
          break;
        case 'rich_text':
          properties[field.column_name] = {
            rich_text: [
              {
                text: {
                  content: String(val)
                }
              }
            ]
          };
          break;
        case 'number':
          const num = Number(val);
          if (isNaN(num)) {
            return NextResponse.json({ 
              error: `Field "${field.field_label || field.column_name}" must be a valid number.` 
            }, { status: 400 });
          }
          properties[field.column_name] = {
            number: num
          };
          break;
        case 'checkbox':
          properties[field.column_name] = {
            checkbox: Boolean(val)
          };
          break;
        case 'select':
          properties[field.column_name] = {
            select: {
              name: String(val)
            }
          };
          break;
        case 'multi_select':
          const arr = Array.isArray(val) ? val : [val];
          properties[field.column_name] = {
            multi_select: arr.filter(Boolean).map(name => ({ name: String(name) }))
          };
          break;
        case 'url':
          properties[field.column_name] = {
            url: String(val)
          };
          break;
        case 'email':
          properties[field.column_name] = {
            email: String(val)
          };
          break;
        case 'phone_number':
          properties[field.column_name] = {
            phone_number: String(val)
          };
          break;
        case 'date':
          properties[field.column_name] = {
            date: {
              start: String(val)
            }
          };
          break;
        default:
          console.warn(`[Nile Scribe] Skipping unsupported Notion column type: ${field.column_type}`);
      }
    }

    // 4. Create the page in Notion
    const notion = new Client({ auth: account.access_token });
    const pageResponse = await notion.pages.create({
      parent: {
        database_id: config.database_id
      },
      properties: properties
    });

    // 5. Update submission stats/timestamp (non-blocking)
    saveConfig({
      ...config,
      last_sync: new Date().toISOString(),
      last_sync_success_count: (config.last_sync_success_count || 0) + 1,
      last_sync_total_count: (config.last_sync_total_count || 0) + 1
    }).catch(err => console.error('[Nile Scribe] Error updating submission stats:', err));

    return NextResponse.json({
      success: true,
      message: 'Sacred Record created successfully.',
      page_id: pageResponse.id
    });
  } catch (error) {
    console.error('[Nile Scribe] Form submission error:', error);
    return NextResponse.json({ 
      error: 'Failed to write form data into Notion: ' + error.message 
    }, { status: 500 });
  }
}
