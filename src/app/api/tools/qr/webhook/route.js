import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { getConfig, getAccount, saveConfig } from '@/lib/db';

function extractUrlValue(sourceProp) {
  if (!sourceProp) return '';
  if (sourceProp.type === 'url') return sourceProp.url || '';
  if (sourceProp.type === 'rich_text') return sourceProp.rich_text?.map(t => t.plain_text).join('') || '';
  if (sourceProp.type === 'title') return sourceProp.title?.map(t => t.plain_text).join('') || '';
  if (sourceProp.type === 'formula') {
    const f = sourceProp.formula;
    if (f?.type === 'string') return f.string || '';
    if (f?.type === 'number') return String(f.number ?? '');
  }
  return '';
}

async function writeErrorColumn(notion, errorColumn, pageId, message) {
  if (!errorColumn) return;
  await notion.pages.update({
    page_id: pageId,
    properties: {
      [errorColumn]: { rich_text: [{ type: 'text', text: { content: message.slice(0, 2000) } }] }
    }
  });
}

async function clearErrorColumn(notion, errorColumn, pageId) {
  if (!errorColumn) return;
  await notion.pages.update({
    page_id: pageId,
    properties: { [errorColumn]: { rich_text: [] } }
  });
}

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const configId = searchParams.get('config_id');
  
  let pageId = searchParams.get('page_id');

  // Try parsing from JSON body if not in query params
  if (!pageId) {
    try {
      const body = await request.json();
      pageId = body.page_id || body.pageId || body.id || body.entity?.id || body.data?.id;
    } catch (e) {
      // Body might be empty or not JSON
    }
  }

  if (!configId) {
    return NextResponse.json({ error: 'Missing config_id query parameter' }, { status: 400 });
  }

  if (!pageId) {
    return NextResponse.json({ error: 'Missing page_id in query parameters or request body JSON' }, { status: 400 });
  }

  const cleanPageId = pageId.trim();

  try {
    // 1. Fetch the database sync configuration
    const config = await getConfig(configId);
    if (!config) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    // 2. Fetch the workspace account details
    const account = await getAccount(config.workspace_id);
    if (!account || !account.access_token) {
      return NextResponse.json({ error: 'Workspace connection not found' }, { status: 404 });
    }

    const settings = config.settings || {};
    const sourceColumn = settings.source_column;
    const targetColumn = settings.target_column;
    const errorColumn = settings.error_column || '';
    const errorCorrectionLevel = settings.error_correction_level || 'M';

    if (!sourceColumn || !targetColumn) {
      return NextResponse.json({ error: 'Configuration column mapping is incomplete' }, { status: 400 });
    }

    const notion = new Client({ auth: account.access_token });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

    try {
      // 3. Fetch the specific page from Notion
      const page = await notion.pages.retrieve({ page_id: cleanPageId });
      
      // --- TRIGGER EVALUATION ---
      const triggerType = settings.trigger_type || 'full';
      const triggerColumn = settings.trigger_column || '';
      const triggerValue = settings.trigger_value || '';
      
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
        // Clear the target column if trigger condition is not met
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
              page_id: cleanPageId,
              properties: clearProperties
            });
          }
        }

        await clearErrorColumn(notion, errorColumn, page.id);

        await saveConfig({
          ...config,
          last_sync: new Date().toISOString(),
          settings: {
            ...settings,
            last_sync_error_count: 0
          }
        });

        return NextResponse.json({
          success: true,
          message: `Condition not met. Cleared target column for page ${cleanPageId}`
        });
      }
      // --- END TRIGGER EVALUATION ---

      // 4. Extract URL from source column
      const sourceProp = page.properties[sourceColumn];
      if (!sourceProp) {
        throw new Error(`Source column "${sourceColumn}" not found on page`);
      }

      const urlValue = extractUrlValue(sourceProp).trim();
      if (!urlValue) {
        throw new Error(`Source column "${sourceColumn}" contains no URL on this page`);
      }

      // 5. Generate QR Code URL with styling parameters
      const foregroundColor = settings.foreground_color || '141311';
      const backgroundColor = settings.background_color || 'F6F0E0';
      const size = settings.size || 250;
      const margin = settings.margin !== undefined ? settings.margin : 2;
      const ecl = ['L', 'M', 'Q', 'H'].includes(errorCorrectionLevel) ? errorCorrectionLevel : 'M';

      let fgHex = foregroundColor.replace('#', '');
      let bgHex = backgroundColor.replace('#', '');
      let qrCodeUrl = `${appUrl}/api/tools/qr/image?data=${encodeURIComponent(urlValue)}&fg=${fgHex}&bg=${bgHex}&size=${size}&margin=${margin}&ecl=${ecl}`;
      if (appUrl.includes('localhost') || appUrl.includes('127.0.0.1')) {
        qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(urlValue)}&color=${fgHex}&bgcolor=${bgHex}&margin=${margin}`;
      }

      // 6. Update target column based on its type
      const targetPropDesc = page.properties[targetColumn];
      if (!targetPropDesc) {
        throw new Error(`Target column "${targetColumn}" not found on page`);
      }

      let updateProperties = {};

      if (targetPropDesc.type === 'files') {
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
        updateProperties[targetColumn] = {
          url: qrCodeUrl
        };
      } else if (targetPropDesc.type === 'rich_text') {
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

      // 7. Perform page property update in Notion
      await notion.pages.update({
        page_id: cleanPageId,
        properties: updateProperties
      });

      await clearErrorColumn(notion, errorColumn, page.id);

      // 8. Update sync timestamp and clear errors in configuration
      await saveConfig({
        ...config,
        last_sync: new Date().toISOString(),
        settings: {
          ...settings,
          last_sync_error_count: 0
        }
      });

      return NextResponse.json({
        success: true,
        message: `Successfully carved QR Code for page ${cleanPageId}`,
        url: urlValue,
        qr_url: qrCodeUrl
      });
    } catch (pageErr) {
      console.error(`Error processing page ${cleanPageId}:`, pageErr);
      await writeErrorColumn(notion, errorColumn, cleanPageId, `Sync error: ${pageErr.message}`).catch(() => {});
      
      // Update config with error count incremented
      await saveConfig({
        ...config,
        last_sync: new Date().toISOString(),
        settings: {
          ...settings,
          last_sync_error_count: 1
        }
      }).catch(() => {});

      return NextResponse.json({ error: 'Failed to process page sync: ' + pageErr.message }, { status: 500 });
    }
  } catch (error) {
    console.error('Webhook sync error:', error);
    return NextResponse.json({ error: 'Failed to process webhook sync: ' + error.message }, { status: 500 });
  }
}
