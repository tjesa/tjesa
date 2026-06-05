import { NextResponse } from 'next/server';
import { getAccount, saveConfig, getConfig } from '@/lib/db';

export async function POST(request) {
  // Retrieve workspace ID from cookies
  const workspaceId = request.cookies.get('tjesa_workspace_id')?.value;

  if (!workspaceId) {
    return NextResponse.json({ error: 'Unauthorized: No active gateway' }, { status: 401 });
  }

  let account = await getAccount(`${workspaceId}_charts`);
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
      chartTitle,
      chartType,
      groupByColumn,
      aggregateOp,
      aggregateColumn,
      colorPalette,
      active = true
    } = await request.json();

    if (!databaseId || !chartTitle || !chartType || !groupByColumn || !aggregateOp || !colorPalette) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Save configuration under tool: 'charts_observatory'
    const savedConfig = await saveConfig({
      id: configId,
      workspace_id: `${workspaceId}_charts`,
      database_id: databaseId,
      database_name: databaseName,
      tool: 'charts_observatory',
      settings: {
        chart_title: chartTitle,
        chart_type: chartType,
        group_by_column: groupByColumn,
        aggregate_op: aggregateOp,
        aggregate_column: aggregateColumn || '',
        color_palette: colorPalette
      },
      last_sync: new Date().toISOString(),
      active: active
    });

    return NextResponse.json({
      success: true,
      config: savedConfig
    });
  } catch (error) {
    console.error('Error saving chart config:', error);
    return NextResponse.json({ error: 'Failed to save chart configuration: ' + error.message }, { status: 500 });
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
      if (!config || (config.workspace_id !== `${workspaceId}_charts` && config.workspace_id !== workspaceId)) {
        return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
      }
      return NextResponse.json({ config });
    }
    return NextResponse.json({ error: 'Missing config ID' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
