import { NextResponse } from 'next/server';
import { getConfig, saveConfig } from '@/lib/db';

export async function POST(request) {
  const workspaceId = request.cookies.get('tjesa_workspace_id')?.value;

  if (!workspaceId) {
    return NextResponse.json({ error: 'Unauthorized: No active gateway' }, { status: 401 });
  }

  try {
    const {
      configId,
      gateActive,
      gateType,
      gatePassword,
      gateAllowedEmails
    } = await request.json();

    if (!configId) {
      return NextResponse.json({ error: 'Missing configuration ID' }, { status: 400 });
    }

    // 1. Retrieve the existing config
    const config = await getConfig(configId);
    if (!config) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    // 2. Verify workspace ownership
    const expectedWorkspaceIds = [
      workspaceId,
      `${workspaceId}_charts`,
      `${workspaceId}_forms`,
      `${workspaceId}_publisher`
    ];

    if (!expectedWorkspaceIds.includes(config.workspace_id)) {
      return NextResponse.json({ error: 'Forbidden: You do not own this configuration' }, { status: 403 });
    }

    // 3. Merge gate settings with existing settings
    const updatedSettings = {
      ...(config.settings || {}),
      gate_active: !!gateActive,
      gate_type: gateType || 'password',
      gate_password: gatePassword || '',
      gate_allowed_emails: gateAllowedEmails || ''
    };

    // 4. Save the config
    const savedConfig = await saveConfig({
      ...config,
      settings: updatedSettings
    });

    return NextResponse.json({
      success: true,
      config: savedConfig
    });
  } catch (error) {
    console.error('Error saving Sphinx Shield config:', error);
    return NextResponse.json({ error: 'Failed to save gate configurations: ' + error.message }, { status: 500 });
  }
}
