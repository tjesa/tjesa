import { NextResponse } from 'next/server';
import { getAccounts } from '@/lib/db';

export async function POST(request) {
  try {
    const accounts = await getAccounts();
    const response = NextResponse.json({
      success: true,
      message: 'Bypass login successful.'
    });

    if (accounts && accounts.length > 0) {
      // If there's an existing real account, bypass-login with it
      const account = accounts[0];
      response.cookies.set('tjesa_workspace_id', account.workspace_id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      });
    } else {
      // If the database is empty, clear the session cookie
      response.cookies.delete('tjesa_workspace_id');
    }

    return response;
  } catch (error) {
    console.error('Bypass authorization error:', error);
    return NextResponse.json({ error: 'Bypass failed: ' + error.message }, { status: 500 });
  }
}
