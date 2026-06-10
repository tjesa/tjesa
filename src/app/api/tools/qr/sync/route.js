import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { getAccount, saveConfig } from '@/lib/db';

export async function POST(request) {
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
    size = 400,
    margin = 2,
    errorCorrectionLevel = 'M',
    errorColumn = ''
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

  const fgHex = foregroundColor.replace('#', '');
  const bgHex = backgroundColor.replace('#', '');
  const ecl = ['L', 'M', 'Q', 'H'].includes(errorCorrectionLevel) ? errorCorrectionLevel : 'M';

  function buildQrUrl(urlValue) {
    if (appUrl.includes('localhost') || appUrl.includes('127.0.0.1')) {
      return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(urlValue)}&color=${fgHex}&bgcolor=${bgHex}&margin=${margin}`;
    }
    return `${appUrl}/api/tools/qr/image?data=${encodeURIComponent(urlValue)}&fg=${fgHex}&bg=${bgHex}&size=${size}&margin=${margin}&ecl=${ecl}`;
  }

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

  try {
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

    for (const page of pages) {
      try {
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

        if (!conditionMet) {
          const targetPropDesc = page.properties[targetColumn];
          if (targetPropDesc) {
            let clearProperties = null;
            if (targetPropDesc.type === 'files' && targetPropDesc.files?.length > 0) {
              clearProperties = { [targetColumn]: { files: [] } };
            } else if (targetPropDesc.type === 'url' && targetPropDesc.url) {
              clearProperties = { [targetColumn]: { url: null } };
            } else if (targetPropDesc.type === 'rich_text' && targetPropDesc.rich_text?.length > 0) {
              clearProperties = { [targetColumn]: { rich_text: [] } };
            }
            if (clearProperties) {
              await notion.pages.update({ page_id: page.id, properties: clearProperties });
              successCount++;
            }
          }
          await clearErrorColumn(page.id);
          continue;
        }

        const urlValue = extractUrlValue(page.properties[sourceColumn]).trim();
        if (!urlValue) continue;

        const qrCodeUrl = buildQrUrl(urlValue);
        const targetPropDesc = page.properties[targetColumn];
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
          throw new Error(`Unsupported target column type: ${targetPropDesc.type}`);
        }

        await notion.pages.update({ page_id: page.id, properties: updateProperties });
        await clearErrorColumn(page.id);
        successCount++;
      } catch (pageErr) {
        errorCount++;
        errors.push({ pageId: page.id, error: pageErr.message });
        console.error(`Error processing page ${page.id}:`, pageErr);
        await writeErrorColumn(page.id, `Sync error: ${pageErr.message}`).catch(() => {});
      }
    }

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
        size,
        margin,
        error_correction_level: ecl,
        error_column: errorColumn
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
