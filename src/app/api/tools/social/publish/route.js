import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { getAccount, getConfig, saveConfig } from '@/lib/db';

export async function POST(request) {
  const workspaceId = request.cookies.get('tjesa_workspace_id')?.value;

  if (!workspaceId) {
    return NextResponse.json({ error: 'Unauthorized: No active gateway' }, { status: 401 });
  }

  try {
    const { configId, pageIds = [] } = await request.json();

    if (!configId || pageIds.length === 0) {
      return NextResponse.json({ error: 'Missing configuration ID or target post page IDs' }, { status: 400 });
    }

    // 1. Fetch Configuration
    const config = await getConfig(configId);
    if (!config || (config.workspace_id !== `${workspaceId}_social` && config.workspace_id !== workspaceId)) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    const settings = config.settings || {};
    const {
      webhook_url,
      use_sandbox = true,
      column_caption,
      column_image,
      column_publish,
      column_date,
      status_published_value = 'Published'
    } = settings;

    if (!column_caption) {
      return NextResponse.json({ error: 'Configuration is missing Caption column mapping' }, { status: 400 });
    }

    // 2. Fetch Notion Credentials
    let account = await getAccount(config.workspace_id);
    if (!account) {
      const baseWorkspaceId = config.workspace_id.replace('_social', '');
      account = await getAccount(baseWorkspaceId);
    }

    if (!account || !account.access_token) {
      return NextResponse.json({ error: 'Notion connection credentials not found' }, { status: 404 });
    }

    const notion = new Client({ auth: account.access_token });

    let successCount = 0;
    let failedCount = 0;
    const logs = [];

    // 3. Loop over requested posts and publish
    for (const pageId of pageIds) {
      try {
        // A. Retrieve Page Properties from Notion
        const page = await notion.pages.retrieve({ page_id: pageId });
        const props = page.properties || {};

        // Resolve Title
        let title = 'Untitled Post';
        const titleKey = Object.keys(props).find(k => props[k].type === 'title');
        if (titleKey) {
          title = props[titleKey]?.title?.map(t => t.plain_text).join('') || 'Untitled Post';
        }

        // Resolve Caption
        let caption = '';
        if (props[column_caption]) {
          const p = props[column_caption];
          if (p.type === 'rich_text') caption = p.rich_text?.map(t => t.plain_text).join('') || '';
          else if (p.type === 'title') caption = p.title?.map(t => t.plain_text).join('') || '';
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

        const publishedAt = new Date().toISOString();

        // B. Dispatch Social Post payload
        const payload = {
          id: pageId,
          title,
          caption,
          imageUrl,
          publishedAt
        };

        if (use_sandbox) {
          console.log(`[SANDBOX SOCIAL DISPATCH] Published page ${pageId}:`);
          console.log(`[SANDBOX SOCIAL DISPATCH] Payload:`, JSON.stringify(payload, null, 2));
          logs.push({ pageId, status: 'sandbox_published', payload });
        } else {
          if (!webhook_url) {
            throw new Error('Webhook URL not configured.');
          }
          const response = await fetch(webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!response.ok) {
            throw new Error(`Webhook delivered status: ${response.status} ${response.statusText}`);
          }
          logs.push({ pageId, status: 'webhook_published', payload });
        }

        // C. Sync Status Back to Notion
        const updateProperties = {};

        if (column_publish && props[column_publish]) {
          const targetPropDesc = props[column_publish];
          if (targetPropDesc.type === 'checkbox') {
            updateProperties[column_publish] = { checkbox: true };
          } else if (targetPropDesc.type === 'select') {
            updateProperties[column_publish] = { select: { name: status_published_value } };
          } else if (targetPropDesc.type === 'status') {
            updateProperties[column_publish] = { status: { name: status_published_value } };
          } else if (targetPropDesc.type === 'rich_text') {
            updateProperties[column_publish] = {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: status_published_value
                  }
                }
              ]
            };
          }
        }

        if (column_date && props[column_date]) {
          const targetPropDesc = props[column_date];
          if (targetPropDesc.type === 'date') {
            updateProperties[column_date] = {
              date: {
                start: publishedAt.substring(0, 10) // Format: YYYY-MM-DD
              }
            };
          }
        }

        if (Object.keys(updateProperties).length > 0) {
          await notion.pages.update({
            page_id: pageId,
            properties: updateProperties
          });
        }

        successCount++;
      } catch (err) {
        failedCount++;
        logs.push({ pageId, status: 'failed', error: err.message });
        console.error(`Failed to publish post ${pageId}:`, err);
      }
    }

    // 4. Update config statistics
    const updatedConfig = await saveConfig({
      ...config,
      last_sync: new Date().toISOString(),
      last_sync_success_count: (config.last_sync_success_count || 0) + successCount,
      last_sync_total_count: (config.last_sync_total_count || 0) + pageIds.length
    });

    return NextResponse.json({
      success: true,
      stats: {
        total: pageIds.length,
        published: successCount,
        failed: failedCount
      },
      config: updatedConfig,
      logs
    });
  } catch (error) {
    console.error('Social publish dispatcher error:', error);
    return NextResponse.json({ error: 'Failed to complete social campaign dispatch: ' + error.message }, { status: 500 });
  }
}
