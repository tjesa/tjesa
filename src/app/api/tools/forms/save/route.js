import { NextResponse } from 'next/server';
import { getAccount, saveConfig, getConfig } from '@/lib/db';

export async function POST(request) {
  // Retrieve workspace ID from cookies
  const workspaceId = request.cookies.get('tjesa_workspace_id')?.value;

  if (!workspaceId) {
    return NextResponse.json({ error: 'Unauthorized: No active gateway' }, { status: 401 });
  }

  const account = await getAccount(`${workspaceId}_forms`);

  if (!account || !account.access_token) {
    return NextResponse.json({ error: 'Workspace token not found' }, { status: 404 });
  }

  try {
    const {
      configId,
      databaseId,
      databaseName,
      formTitle,
      formDescription,
      fields,
      active = true
    } = await request.json();

    if (!databaseId || !formTitle || !fields || !Array.isArray(fields)) {
      return NextResponse.json({ error: 'Missing required parameters (databaseId, formTitle, fields)' }, { status: 400 });
    }

    // Save configuration under tool: 'form_builder'
    const savedConfig = await saveConfig({
      id: configId,
      workspace_id: `${workspaceId}_forms`,
      database_id: databaseId,
      database_name: databaseName,
      tool: 'form_builder',
      settings: {
        form_title: formTitle,
        form_description: formDescription,
        fields: fields
      },
      last_sync: new Date().toISOString(),
      active: active
    });

    return NextResponse.json({
      success: true,
      config: savedConfig
    });
  } catch (error) {
    console.error('Error saving form config:', error);
    return NextResponse.json({ error: 'Failed to save form configuration: ' + error.message }, { status: 500 });
  }
}

export async function GET(request) {
  // Support fetching configs for forms
  const workspaceId = request.cookies.get('tjesa_workspace_id')?.value;

  if (!workspaceId) {
    return NextResponse.json({ error: 'Unauthorized: No active gateway' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const configId = searchParams.get('id');

    if (configId) {
      const config = await getConfig(configId);
      if (!config || config.workspace_id !== `${workspaceId}_forms`) {
        return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
      }
      return NextResponse.json({ config });
    }
    return NextResponse.json({ error: 'Missing config ID' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
