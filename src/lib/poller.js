import { Client } from '@notionhq/client';
import { getAccounts, getConfigs, saveConfig } from './db';

let isPolling = false;

// 1. Helper function for QR Generator sync
async function syncQRGenerator(account, config) {
  const syncStartTime = new Date().toISOString();
  const settings = config.settings || {};
  const triggerType = settings.trigger_type || 'full';
  const triggerColumn = settings.trigger_column || '';
  const triggerValue = settings.trigger_value || '';
  const sourceColumn = settings.source_column;
  const targetColumn = settings.target_column;
  const foregroundColor = settings.foreground_color || '141311';
  const backgroundColor = settings.background_color || 'F6F0E0';
  const size = settings.size || 250;
  const margin = settings.margin !== undefined ? settings.margin : 2;

  if (triggerType === 'webhook') {
    return; // Webhook configurations are triggered on-demand, not polled in background
  }

  if (!sourceColumn || !targetColumn) {
    return;
  }

  const notion = new Client({ auth: account.access_token });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Query pages from the Notion data source
  let hasMore = true;
  let startCursor = undefined;
  const pages = [];

  while (hasMore) {
    const response = await notion.dataSources.query({
      data_source_id: config.database_id,
      start_cursor: startCursor,
      page_size: 100
    });
    pages.push(...response.results);
    hasMore = response.has_more;
    startCursor = response.next_cursor;
  }

  let successCount = 0;
  let totalCount = pages.length;
  let hasUpdated = false;
  const lastSyncTime = config.last_sync ? new Date(config.last_sync).getTime() : 0;

  for (const page of pages) {
    try {
      // 0. Delta filtering: Skip unchanged pages
      const pageEditedTime = new Date(page.last_edited_time).getTime();
      if (lastSyncTime && pageEditedTime <= lastSyncTime) {
        continue;
      }

      // 1. Evaluate Trigger conditions
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
            if (triggerProp.type === 'select') val = triggerProp.select?.name || '';
            else if (triggerProp.type === 'status') val = triggerProp.status?.name || '';
            else if (triggerProp.type === 'multi_select') {
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

      let targetPropDesc = page.properties[targetColumn];
      if (targetPropDesc && targetPropDesc.type === 'files') {
        try {
          const fullPage = await notion.pages.retrieve({ page_id: page.id });
          targetPropDesc = fullPage.properties[targetColumn] || targetPropDesc;
        } catch (retrieveErr) {
          console.error(`[Tjesa Poller] Error retrieving full page properties for ${page.id}:`, retrieveErr);
        }
      }

      if (!conditionMet) {
        // If the condition is not met, clear the QR code target column if it's not already empty
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
            hasUpdated = true;
          }
        }
        continue;
      }

      // 2. Process source URL
      const sourceProp = page.properties[sourceColumn];
      let urlValue = '';
      if (!sourceProp) continue;

      if (sourceProp.type === 'url') {
        urlValue = sourceProp.url || '';
      } else if (sourceProp.type === 'rich_text') {
        urlValue = sourceProp.rich_text?.map(t => t.plain_text).join('') || '';
      } else if (sourceProp.type === 'title') {
        urlValue = sourceProp.title?.map(t => t.plain_text).join('') || '';
      }

      urlValue = urlValue.trim();
      if (!urlValue) continue;

      let fgHex = foregroundColor.replace('#', '');
      let bgHex = backgroundColor.replace('#', '');
      let qrCodeUrl = `${appUrl}/api/tools/qr/image?data=${encodeURIComponent(urlValue)}&fg=${fgHex}&bg=${bgHex}&size=${size}&margin=${margin}`;
      if (appUrl.includes('localhost') || appUrl.includes('127.0.0.1')) {
        qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(urlValue)}&color=${fgHex}&bgcolor=${bgHex}&margin=${margin}`;
      }

      // 3. Update target
      if (!targetPropDesc) continue;

      let updateProperties = {};
      if (targetPropDesc.type === 'files') {
        const existingFile = targetPropDesc.files?.[0];
        if (existingFile && existingFile.type === 'external' && existingFile.external?.url === qrCodeUrl) {
          continue; // Skip if already matching
        }
        updateProperties[targetColumn] = {
          files: [{ name: 'QR Code', type: 'external', external: { url: qrCodeUrl } }]
        };
      } else if (targetPropDesc.type === 'url') {
        if (targetPropDesc.url === qrCodeUrl) continue;
        updateProperties[targetColumn] = { url: qrCodeUrl };
      } else if (targetPropDesc.type === 'rich_text') {
        const existingText = targetPropDesc.rich_text?.map(t => t.plain_text).join('') || '';
        if (existingText === qrCodeUrl) continue;
        updateProperties[targetColumn] = {
          rich_text: [{ type: 'text', text: { content: qrCodeUrl } }]
        };
      } else {
        continue;
      }

      // Update in Notion
      await notion.pages.update({
        page_id: page.id,
        properties: updateProperties
      });

      successCount++;
      hasUpdated = true;
    } catch (pageErr) {
      console.error(`[Tjesa Poller] Error updating page ${page.id}:`, pageErr);
    }
  }

  if (hasUpdated) {
    console.log(`[Tjesa Poller] Successfully sync'd ${successCount} QR codes for database "${config.database_name}"`);
  }

  // Always update last_sync to prevent reprocessing unchanged pages
  await saveConfig({
    ...config,
    last_sync: syncStartTime,
    last_sync_success_count: successCount,
    last_sync_total_count: totalCount
  });
}

// 2. Main Background Poller loop
export async function pollAndSync() {
  if (isPolling) return;
  isPolling = true;

  try {
    const accounts = await getAccounts();
    for (const account of accounts) {
      if (!account.access_token) continue;
      
      const configs = await getConfigs(account.workspace_id);
      const activeConfigs = configs.filter(c => c.active);
      
      if (activeConfigs.length === 0) continue;

      for (const config of activeConfigs) {
        try {
          if (config.tool === 'qr_generator') {
            await syncQRGenerator(account, config);
          } else {
            console.log(`[Tjesa Poller] Skipping background configuration for unknown tool type: ${config.tool}`);
          }
        } catch (configErr) {
          console.error(`[Tjesa Poller] Error syncing config ${config.id}:`, configErr);
          if (configErr.code === 'object_not_found' || configErr.status === 404) {
            try {
              console.warn(`[Tjesa Poller] Auto-deactivating configuration "${config.id}" ("${config.database_name}") because the database was not found or has been unshared.`);
              await saveConfig({
                ...config,
                active: false
              });
            } catch (saveErr) {
              console.error(`[Tjesa Poller] Failed to auto-deactivate config:`, saveErr);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('[Tjesa Poller] Main poller loop failed:', err);
  } finally {
    isPolling = false;
  }
}

// Start interval loop in background (every 15 seconds) with a hot-reload guard
if (typeof window === 'undefined') {
  if (!global.tjesaPollerInterval) {
    console.log('[Tjesa Poller] Background polling worker initialized (5s interval).');
    global.tjesaPollerInterval = setInterval(pollAndSync, 5000);
  }
}
