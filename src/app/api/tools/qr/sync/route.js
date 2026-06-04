import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { getAccount, saveConfig } from '@/lib/db';

export async function POST(request) {
  // Retrieve workspace ID from cookies
  const workspaceId = request.cookies.get('tjesa_workspace_id')?.value;

  if (!workspaceId) {
    return NextResponse.json({ error: 'Unauthorized: No active gateway' }, { status: 401 });
  }

  const account = await getAccount(`${workspaceId}_qr`);

  if (!account || !account.access_token) {
    return NextResponse.json({ error: 'Workspace token not found' }, { status: 404 });
  }

  const { 
    configId, 
    databaseId, 
    databaseName, 
    sourceColumn, 
    targetColumn,
    triggerType = 'full',
    triggerColumn = '',
    triggerValue = '',
    foregroundColor = '141311',
    backgroundColor = 'F6F0E0',
    size = 250,
    margin = 2
  } = await request.json();

  if (!databaseId || !sourceColumn || !targetColumn) {
    return NextResponse.json({ error: 'Missing required sync parameters' }, { status: 400 });
  }

  const notion = new Client({ auth: account.access_token });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

  let totalCount = 0;
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  try {
    // 1. Query the database rows
    let hasMore = true;
    let startCursor = undefined;
    const pages = [];

    while (hasMore) {
      const response = await notion.dataSources.query({
        data_source_id: databaseId,
        start_cursor: startCursor,
        page_size: 100
      });

      pages.push(...response.results);
      hasMore = response.has_more;
      startCursor = response.next_cursor;
    }

    totalCount = pages.length;

    // 2. Iterate and update each row
    for (const page of pages) {
      try {
        // --- TRIGGER EVALUATION ---
        let conditionMet = true;
        if (triggerType === 'checkbox') {
          if (triggerColumn) {
            const triggerProp = page.properties[triggerColumn];
            if (!triggerProp || triggerProp.type !== 'checkbox' || !triggerProp.checkbox) {
              conditionMet = false;
            }
          } else {
            conditionMet = false;
          }
        } else if (triggerType === 'select') {
          if (triggerColumn) {
            const triggerProp = page.properties[triggerColumn];
            if (triggerProp) {
              let val = '';
              if (triggerProp.type === 'select') {
                val = triggerProp.select?.name || '';
              } else if (triggerProp.type === 'status') {
                val = triggerProp.status?.name || '';
              } else if (triggerProp.type === 'multi_select') {
                const names = triggerProp.multi_select?.map(x => x.name) || [];
                if (names.includes(triggerValue)) {
                  val = triggerValue;
                }
              }
              if (val !== triggerValue) {
                conditionMet = false;
              }
            } else {
              conditionMet = false;
            }
          } else {
            conditionMet = false;
          }
        }

        if (!conditionMet) {
          // If the condition is not met, clear the QR code target column if it's not already empty
          const targetPropDesc = page.properties[targetColumn];
          if (targetPropDesc) {
            let clearProperties = null;

            if (targetPropDesc.type === 'files') {
              if (targetPropDesc.files && targetPropDesc.files.length > 0) {
                clearProperties = {
                  [targetColumn]: {
                    files: []
                  }
                };
              }
            } else if (targetPropDesc.type === 'url') {
              if (targetPropDesc.url) {
                clearProperties = {
                  [targetColumn]: {
                    url: null
                  }
                };
              }
            } else if (targetPropDesc.type === 'rich_text') {
              if (targetPropDesc.rich_text && targetPropDesc.rich_text.length > 0) {
                clearProperties = {
                  [targetColumn]: {
                    rich_text: []
                  }
                };
              }
            }

            if (clearProperties) {
              await notion.pages.update({
                page_id: page.id,
                properties: clearProperties
              });
              successCount++;
            }
          }
          continue;
        }
        // --- END TRIGGER EVALUATION ---

        const sourceProp = page.properties[sourceColumn];
        let urlValue = '';

        if (!sourceProp) continue;

        // Extract text/URL depending on column type
        if (sourceProp.type === 'url') {
          urlValue = sourceProp.url || '';
        } else if (sourceProp.type === 'rich_text') {
          urlValue = sourceProp.rich_text?.map(t => t.plain_text).join('') || '';
        } else if (sourceProp.type === 'title') {
          urlValue = sourceProp.title?.map(t => t.plain_text).join('') || '';
        }

        // Clean and validate URL
        urlValue = urlValue.trim();
        if (!urlValue) {
          // Skip rows with no URL value
          continue;
        }

        // Construct the QR code URL with styling parameters
        let fgHex = foregroundColor.replace('#', '');
        let bgHex = backgroundColor.replace('#', '');
        let qrCodeUrl = `${appUrl}/api/tools/qr/image?data=${encodeURIComponent(urlValue)}&fg=${fgHex}&bg=${bgHex}&size=${size}&margin=${margin}`;
        if (appUrl.includes('localhost') || appUrl.includes('127.0.0.1')) {
          qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(urlValue)}&color=${fgHex}&bgcolor=${bgHex}&margin=${margin}`;
        }

        // Determine the update payload based on target column type
        const targetPropDesc = page.properties[targetColumn];
        if (!targetPropDesc) continue;

        let updateProperties = {};

        if (targetPropDesc.type === 'files') {
          // Check if it already has this exact QR code URL to avoid redundant API updates
          const existingFile = targetPropDesc.files?.[0];
          if (existingFile && existingFile.type === 'external' && existingFile.external?.url === qrCodeUrl) {
            continue; // Skip because it's already generated and identical
          }

          updateProperties[targetColumn] = {
            files: [
              {
                name: 'QR Code',
                type: 'external',
                external: {
                  url: qrCodeUrl
                }
              }
            ]
          };
        } else if (targetPropDesc.type === 'url') {
          if (targetPropDesc.url === qrCodeUrl) continue;
          updateProperties[targetColumn] = {
            url: qrCodeUrl
          };
        } else if (targetPropDesc.type === 'rich_text') {
          const existingText = targetPropDesc.rich_text?.map(t => t.plain_text).join('') || '';
          if (existingText === qrCodeUrl) continue;
          updateProperties[targetColumn] = {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: qrCodeUrl
                }
              }
            ]
          };
        } else {
          throw new Error(`Unsupported target column type: ${targetPropDesc.type}`);
        }

        // Perform page property update in Notion
        await notion.pages.update({
          page_id: page.id,
          properties: updateProperties
        });

        successCount++;
      } catch (pageErr) {
        errorCount++;
        errors.push({ pageId: page.id, error: pageErr.message });
        console.error(`Error processing page ${page.id}:`, pageErr);
      }
    }

    // 3. Save / Update this configuration in our database
    const updatedConfig = await saveConfig({
      id: configId,
      workspace_id: `${workspaceId}_qr`,
      database_id: databaseId,
      database_name: databaseName,
      tool: 'qr_generator',
      settings: {
        source_column: sourceColumn,
        target_column: targetColumn,
        trigger_type: triggerType,
        trigger_column: triggerColumn,
        trigger_value: triggerValue,
        foreground_color: foregroundColor,
        background_color: backgroundColor,
        size: size,
        margin: margin
      },
      last_sync: new Date().toISOString(),
      last_sync_success_count: successCount,
      last_sync_total_count: totalCount,
      active: true
    });

    return NextResponse.json({
      success: true,
      config: updatedConfig,
      stats: {
        total: totalCount,
        synced: successCount,
        failed: errorCount,
        skipped: totalCount - successCount - errorCount
      },
      errors
    });
  } catch (error) {
    console.error('Database query/sync error:', error);
    return NextResponse.json({ error: 'Failed to synchronize Notion database: ' + error.message }, { status: 500 });
  }
}
