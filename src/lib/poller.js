import { Client } from '@notionhq/client';
import { getAccounts, getConfigs, saveConfig } from './db';

let isPolling = false;

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

async function syncQRGenerator(account, config) {
  const syncStartTime = new Date().toISOString();
  const settings = config.settings || {};
  const triggerType = settings.trigger_type || 'full';
  const triggerColumn = settings.trigger_column || '';
  const triggerValue = settings.trigger_value || '';
  const sourceColumn = settings.source_column;
  const targetColumn = settings.target_column;
  const errorColumn = settings.error_column || '';
  const foregroundColor = settings.foreground_color || '141311';
  const backgroundColor = settings.background_color || 'F6F0E0';
  const size = settings.size || 400;
  const margin = settings.margin !== undefined ? settings.margin : 2;
  const ecl = ['L', 'M', 'Q', 'H'].includes(settings.error_correction_level) ? settings.error_correction_level : 'M';

  if (triggerType === 'webhook') return;
  if (!sourceColumn || !targetColumn) return;

  const notion = new Client({ auth: account.access_token });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const fgHex = foregroundColor.replace('#', '');
  const bgHex = backgroundColor.replace('#', '');

  function buildQrUrl(urlValue) {
    if (appUrl.includes('localhost') || appUrl.includes('127.0.0.1')) {
      return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(urlValue)}&color=${fgHex}&bgcolor=${bgHex}&margin=${margin}`;
    }
    return `${appUrl}/api/tools/qr/image?data=${encodeURIComponent(urlValue)}&fg=${fgHex}&bg=${bgHex}&size=${size}&margin=${margin}&ecl=${ecl}`;
  }

  async function writeErrorColumn(pageId, message) {
    if (!errorColumn) return;
    await notion.pages.update({
      page_id: pageId,
      properties: {
        [errorColumn]: { rich_text: [{ type: 'text', text: { content: message.slice(0, 2000) } }] }
      }
    });
  }

  async function clearErrorColumn(pageId) {
    if (!errorColumn) return;
    await notion.pages.update({
      page_id: pageId,
      properties: { [errorColumn]: { rich_text: [] } }
    });
  }

  let hasMore = true;
  let startCursor = undefined;
  const pages = [];

  while (hasMore) {
    const response = await notion.dataSources.query({
      data_source_id: config.database_id,
      result_type: 'page',
      start_cursor: startCursor,
      page_size: 100
    });
    pages.push(...response.results.filter(r => r.object === 'page'));
    hasMore = response.has_more;
    startCursor = response.next_cursor;
  }

  let successCount = 0;
  let totalCount = pages.length;
  let hasUpdated = false;

  for (const partialPage of pages) {
    try {
      // Upgrade PartialPageObjectResponse (only has id/object, no properties) to full page
      const page = partialPage.properties
        ? partialPage
        : await notion.pages.retrieve({ page_id: partialPage.id });

      // Trigger evaluation
      let conditionMet = true;
      if (triggerType === 'checkbox') {
        const triggerProp = triggerColumn ? page.properties[triggerColumn] : null;
        conditionMet = !!(triggerProp?.type === 'checkbox' && triggerProp.checkbox);
      } else if (triggerType === 'select') {
        const triggerProp = triggerColumn ? page.properties[triggerColumn] : null;
        if (triggerProp) {
          let val = '';
          if (triggerProp.type === 'select') val = triggerProp.select?.name || '';
          else if (triggerProp.type === 'status') val = triggerProp.status?.name || '';
          else if (triggerProp.type === 'multi_select') {
            const names = triggerProp.multi_select?.map(x => x.name) || [];
            if (names.includes(triggerValue)) val = triggerValue;
          }
          conditionMet = val === triggerValue;
        } else {
          conditionMet = false;
        }
      }

      let targetPropDesc = page.properties[targetColumn];
      if (targetPropDesc?.type === 'files') {
        try {
          const fullPage = await notion.pages.retrieve({ page_id: page.id });
          targetPropDesc = fullPage.properties[targetColumn] || targetPropDesc;
        } catch (retrieveErr) {
          console.error(`[Tjesa Poller] Error retrieving full page properties for ${page.id}:`, retrieveErr);
        }
      }

      if (!conditionMet) {
        let clearProperties = null;
        if (targetPropDesc?.type === 'files' && targetPropDesc.files?.length > 0) {
          clearProperties = { [targetColumn]: { files: [] } };
        } else if (targetPropDesc?.type === 'url' && targetPropDesc.url) {
          clearProperties = { [targetColumn]: { url: null } };
        } else if (targetPropDesc?.type === 'rich_text' && targetPropDesc.rich_text?.length > 0) {
          clearProperties = { [targetColumn]: { rich_text: [] } };
        }

        if (clearProperties) {
          await notion.pages.update({ page_id: page.id, properties: clearProperties });
          successCount++;
          hasUpdated = true;
        }
        await clearErrorColumn(page.id);
        continue;
      }

      const urlValue = extractUrlValue(page.properties[sourceColumn]).trim();
      if (!urlValue) continue;

      const qrCodeUrl = buildQrUrl(urlValue);
      if (!targetPropDesc) continue;

      let updateProperties = {};
      if (targetPropDesc.type === 'files') {
        const existingFile = targetPropDesc.files?.[0];
        if (existingFile?.type === 'external' && existingFile.external?.url === qrCodeUrl) continue;
        updateProperties[targetColumn] = { files: [{ name: 'QR Code', type: 'external', external: { url: qrCodeUrl } }] };
      } else if (targetPropDesc.type === 'url') {
        if (targetPropDesc.url === qrCodeUrl) continue;
        updateProperties[targetColumn] = { url: qrCodeUrl };
      } else if (targetPropDesc.type === 'rich_text') {
        const existingText = targetPropDesc.rich_text?.map(t => t.plain_text).join('') || '';
        if (existingText === qrCodeUrl) continue;
        updateProperties[targetColumn] = { rich_text: [{ type: 'text', text: { content: qrCodeUrl } }] };
      } else {
        continue;
      }

      await notion.pages.update({ page_id: page.id, properties: updateProperties });
      await clearErrorColumn(page.id);
      successCount++;
      hasUpdated = true;
    } catch (pageErr) {
      console.error(`[Tjesa Poller] Error updating page ${page.id}:`, pageErr);
      await writeErrorColumn(page.id, `Sync error: ${pageErr.message}`).catch(() => {});
    }
  }

  if (hasUpdated) {
    console.log(`[Tjesa Poller] Successfully sync'd ${successCount} QR codes for database "${config.database_name}"`);
  }

  await saveConfig({
    ...config,
    last_sync: syncStartTime,
    last_sync_success_count: successCount,
    last_sync_total_count: totalCount
  });
}

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
              await saveConfig({ ...config, active: false });
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

// Hot-reload guard, 30s polling interval
if (typeof window === 'undefined') {
  if (!global.tjesaPollerInterval) {
    console.log('[Tjesa Poller] Background polling worker initialized (30s interval).');
    global.tjesaPollerInterval = setInterval(pollAndSync, 30000);
  }
}
