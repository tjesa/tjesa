import { NextResponse } from 'next/server';
import { saveAccount } from '@/lib/db';
import { getCurrentUser } from '@/lib/supabase/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('Notion OAuth error callback:', error);
    return NextResponse.redirect(new URL('/?error=' + error, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  const clientId = process.env.NOTION_CLIENT_ID;
  const clientSecret = process.env.NOTION_CLIENT_SECRET;
  const redirectUri = process.env.NOTION_REDIRECT_URI;

  try {
    // Exchange temporary code for access token
    const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Error exchanging token:', tokenData);
      return NextResponse.redirect(new URL('/?error=token_exchange_failed', request.url));
    }

    const user = await getCurrentUser();

    // Extract connected workspace details
    const account = {
      workspace_id: tokenData.workspace_id,
      workspace_name: tokenData.workspace_name,
      workspace_icon: tokenData.workspace_icon,
      access_token: tokenData.access_token,
      bot_id: tokenData.bot_id,
      owner: tokenData.owner,
      user_id: user?.id || null,
      connected_at: new Date().toISOString(),
    };

    // Save to our lightweight file-based database
    await saveAccount(account);

    // Create the response redirecting to /dashboard
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    
    // Set a secure cookie with the workspace ID for session persistence
    response.cookies.set('tjesa_workspace_id', account.workspace_id, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
      domain: process.env.NODE_ENV === 'production' ? '.tjesa.com' : undefined,
    });

    return response;
  } catch (err) {
    console.error('OAuth Callback Exception:', err);
    return NextResponse.redirect(new URL('/?error=server_exception', request.url));
  }
}
