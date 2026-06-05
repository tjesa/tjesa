import { NextResponse } from 'next/server';
import { getAccount, saveConfig, getConfig, getConfigs } from '@/lib/db';

export async function POST(request) {
  const workspaceId = request.cookies.get('tjesa_workspace_id')?.value;

  if (!workspaceId) {
    return NextResponse.json({ error: 'Unauthorized: No active gateway' }, { status: 401 });
  }

  let account = await getAccount(`${workspaceId}_social`);
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
      webhookUrl = '',
      useSandbox = true,
      columnCaption = '',
      columnImage = '',
      columnTrigger = '',
      columnPublish = '',
      columnDate = '',
      triggerValue = 'Ready',
      statusPublishedValue = 'Published',
      active = true
    } = await request.json();

    if (!databaseId || !columnCaption) {
      return NextResponse.json({ error: 'Missing required configuration parameters (Database and Caption column)' }, { status: 400 });
    }

    if (!useSandbox && !webhookUrl) {
      return NextResponse.json({ error: 'Webhook URL is required when Sandbox Mode is deactivated' }, { status: 400 });
    }

    // Save configuration under tool: 'social_herald'
    const savedConfig = await saveConfig({
      id: configId,
      workspace_id: `${workspaceId}_social`,
      database_id: databaseId,
      database_name: databaseName,
      tool: 'social_herald',
      settings: {
        webhook_url: webhookUrl,
        use_sandbox: useSandbox,
        column_caption: columnCaption,
        column_image: columnImage,
        column_trigger: columnTrigger,
        column_publish: columnPublish,
        column_date: columnDate,
        trigger_value: triggerValue,
        status_published_value: statusPublishedValue
      },
      last_sync: new Date().toISOString(),
      active: active
    });

    return NextResponse.json({
      success: true,
      config: savedConfig
    });
  } catch (error) {
    console.error('Error saving Social config:', error);
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
      if (!config || (config.workspace_id !== `${workspaceId}_social` && config.workspace_id !== workspaceId)) {
        return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
      }
      return NextResponse.json({ config });
    }

    // Return list of configurations
    const configs = await getConfigs(`${workspaceId}_social`);
    return NextResponse.json({ configs });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
