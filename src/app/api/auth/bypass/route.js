import { NextResponse } from 'next/server';
import { getAccounts } from '@/lib/db';

export async function POST(request) {
  try {
    const accounts = await getAccounts();
    const response = NextResponse.json({
      success: true,
      message: 'Bypass login successful.'
    });

    // Set the bypass active cookie
    response.cookies.set('tjesa_bypass_active', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    });

    if (accounts && accounts.length > 0) {
      // Find the first workspace account and associate it (normalize workspace_id)
      const account = accounts[0];
      const workspaceId = account.workspace_id.split('_')[0];
      response.cookies.set('tjesa_workspace_id', workspaceId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      });
    } else {
      response.cookies.delete('tjesa_workspace_id');
    }

    return response;
  } catch (error) {
    console.error('Bypass authorization error:', error);
    return NextResponse.json({ error: 'Bypass failed: ' + error.message }, { status: 500 });
  }
}
