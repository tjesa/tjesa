import { NextResponse } from 'next/server';
import { getAccount, saveConfig, getConfig, getConfigs } from '@/lib/db';

export async function POST(request) {
  const workspaceId = request.cookies.get('tjesa_workspace_id')?.value;

  if (!workspaceId) {
    return NextResponse.json({ error: 'Unauthorized: No active gateway' }, { status: 401 });
  }

  let account = await getAccount(`${workspaceId}_mail`);
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
      smtpHost = '',
      smtpPort = '',
      smtpUser = '',
      smtpPass = '',
      smtpFromEmail = '',
      smtpFromName = '',
      useSandbox = true,
      columnEmail = '',
      columnName = '',
      columnStatus = '',
      statusSentValue = 'Sent',
      emailSubject = '',
      emailBody = '',
      active = true
    } = await request.json();

    if (!databaseId || !columnEmail || !emailSubject || !emailBody) {
      return NextResponse.json({ error: 'Missing required configuration fields' }, { status: 400 });
    }

    // Save configuration under tool: 'mail_dispatcher'
    const savedConfig = await saveConfig({
      id: configId,
      workspace_id: `${workspaceId}_mail`,
      database_id: databaseId,
      database_name: databaseName,
      tool: 'mail_dispatcher',
      settings: {
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_user: smtpUser,
        smtp_pass: smtpPass,
        smtp_from_email: smtpFromEmail,
        smtp_from_name: smtpFromName,
        use_sandbox: useSandbox,
        column_email: columnEmail,
        column_name: columnName,
        column_status: columnStatus,
        status_sent_value: statusSentValue,
        email_subject: emailSubject,
        email_body: emailBody
      },
      last_sync: new Date().toISOString(),
      active: active
    });

    return NextResponse.json({
      success: true,
      config: savedConfig
    });
  } catch (error) {
    console.error('Error saving Mail config:', error);
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
      if (!config || (config.workspace_id !== `${workspaceId}_mail` && config.workspace_id !== workspaceId)) {
        return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
      }
      return NextResponse.json({ config });
    }

    // Return list of configurations
    const configs = await getConfigs(`${workspaceId}_mail`);
    return NextResponse.json({ configs });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
