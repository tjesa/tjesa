import { NextResponse } from 'next/server';
import { getAccount, saveConfig, getConfig, getConfigs } from '@/lib/db';

export async function POST(request) {
  const workspaceId = request.cookies.get('tjesa_workspace_id')?.value;

  if (!workspaceId) {
    return NextResponse.json({ error: 'Unauthorized: No active gateway' }, { status: 401 });
  }

  let account = await getAccount(`${workspaceId}_pdf`);
  if (!account) {
    account = await getAccount(workspaceId);
  }

  if (!account || !account.access_token) {
    return NextResponse.json({ error: 'Workspace token not found' }, { status: 404 });
  }

  try {
    const {
      configId,
      databaseId,
      databaseName,
      pdfTitle,
      pdfPageSize = 'A4',
      pdfMargins = 'standard',
      pdfOrientation = 'portrait',
      active = true
    } = await request.json();

    if (!databaseId || !pdfTitle) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Save configuration under tool: 'pdf_exporter'
    const savedConfig = await saveConfig({
      id: configId,
      workspace_id: `${workspaceId}_pdf`,
      database_id: databaseId,
      database_name: databaseName,
      tool: 'pdf_exporter',
      settings: {
        pdf_title: pdfTitle,
        pdf_page_size: pdfPageSize,
        pdf_margins: pdfMargins,
        pdf_orientation: pdfOrientation
      },
      last_sync: new Date().toISOString(),
      active: active
    });

    return NextResponse.json({
      success: true,
      config: savedConfig
    });
  } catch (error) {
    console.error('Error saving PDF config:', error);
    return NextResponse.json({ error: 'Failed to save configuration: ' + error.message }, { status: 500 });
  }
}

export async function GET(request) {
  const workspaceId = request.cookies.get('tjesa_workspace_id')?.value;

  if (!workspaceId) {
    return NextResponse.json({ error: 'Unauthorized: No active gateway' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const configId = searchParams.get('id');

    if (configId) {
      const config = await getConfig(configId);
      if (!config || (config.workspace_id !== `${workspaceId}_pdf` && config.workspace_id !== workspaceId)) {
        return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
      }
      return NextResponse.json({ config });
    }

    // Return list of configurations
    const configs = await getConfigs(`${workspaceId}_pdf`);
    return NextResponse.json({ configs });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
