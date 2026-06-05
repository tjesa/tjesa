import { NextResponse } from 'next/server';
import { getAccount, saveConfig, getConfig, getConfigs } from '@/lib/db';

export async function POST(request) {
  const workspaceId = request.cookies.get('tjesa_workspace_id')?.value;

  if (!workspaceId) {
    return NextResponse.json({ error: 'Unauthorized: No active gateway' }, { status: 401 });
  }

  let account = await getAccount(`${workspaceId}_publisher`);
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
      siteTitle,
      siteDescription,
      statusColumn,
      statusValue,
      dateColumn,
      slugColumn,
      theme,
      active = true
    } = await request.json();

    if (!databaseId || !siteTitle || !statusColumn || !statusValue || !dateColumn || !slugColumn || !theme) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Save configuration under tool: 'papyrus_publisher'
    const savedConfig = await saveConfig({
      id: configId,
      workspace_id: `${workspaceId}_publisher`,
      database_id: databaseId,
      database_name: databaseName,
      tool: 'papyrus_publisher',
      settings: {
        site_title: siteTitle,
        site_description: siteDescription || '',
        status_column: statusColumn,
        status_value: statusValue,
        date_column: dateColumn,
        slug_column: slugColumn,
        theme: theme
      },
      last_sync: new Date().toISOString(),
      active: active
    });

    return NextResponse.json({
      success: true,
      config: savedConfig
    });
  } catch (error) {
    console.error('Error saving publisher config:', error);
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
      if (!config || (config.workspace_id !== `${workspaceId}_publisher` && config.workspace_id !== workspaceId)) {
        return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
      }
      return NextResponse.json({ config });
    }

    // Return list of configurations if no id is provided
    const configs = await getConfigs(`${workspaceId}_publisher`);
    return NextResponse.json({ configs });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
