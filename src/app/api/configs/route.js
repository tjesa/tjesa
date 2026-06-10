import { NextResponse } from 'next/server';
import { deleteConfig, saveConfig } from '@/lib/db';

export async function POST(request) {
  const workspaceId = request.cookies.get('tjesa_workspace_id')?.value;

  if (!workspaceId) {
    return NextResponse.json({ error: 'Unauthorized: No active gateway' }, { status: 401 });
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
    foregroundColor = '#141311',
    backgroundColor = '#F6F0E0',
    size = 250,
    margin = 2,
    errorCorrectionLevel = 'M',
    errorColumn = ''
  } = await request.json();

  if (!databaseId || !sourceColumn || !targetColumn) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    const config = await saveConfig({
      id: configId || null,
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
        error_correction_level: errorCorrectionLevel,
        error_column: errorColumn
      },
      active: true
    });

    return NextResponse.json({ config });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save configuration: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing configuration ID' }, { status: 400 });
  }

  try {
    await deleteConfig(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete configuration: ' + error.message }, { status: 500 });
  }
}
