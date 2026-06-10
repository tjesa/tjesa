import { NextResponse } from 'next/server';
import { saveAccount } from '@/lib/db';
import { getCurrentUser } from '@/lib/supabase/server';

export async function GET(request, { params }) {
  const { tool } = await params;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error(`Notion OAuth error callback for ${tool}:`, error);
    return NextResponse.redirect(new URL('/?error=' + error, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  // Load connection keys based on the specific tool callback
  let clientId;
  let clientSecret;
  let redirectUri;

  if (tool === 'qr') {
    clientId = process.env.NOTION_QR_CLIENT_ID;
    clientSecret = process.env.NOTION_QR_CLIENT_SECRET;
    redirectUri = process.env.NOTION_QR_REDIRECT_URI;
  } else if (tool === 'forms') {
    clientId = process.env.NOTION_FORMS_CLIENT_ID;
    clientSecret = process.env.NOTION_FORMS_CLIENT_SECRET;
    redirectUri = process.env.NOTION_FORMS_REDIRECT_URI;
  } else if (tool === 'charts') {
    clientId = process.env.NOTION_CHARTS_CLIENT_ID || process.env.NOTION_CLIENT_ID;
    clientSecret = process.env.NOTION_CHARTS_CLIENT_SECRET || process.env.NOTION_CLIENT_SECRET;
    redirectUri = process.env.NOTION_CHARTS_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/charts`;
  } else if (tool === 'publisher') {
    clientId = process.env.NOTION_PUBLISHER_CLIENT_ID || process.env.NOTION_CLIENT_ID;
    clientSecret = process.env.NOTION_PUBLISHER_CLIENT_SECRET || process.env.NOTION_CLIENT_SECRET;
    redirectUri = process.env.NOTION_PUBLISHER_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/publisher`;
  } else if (tool === 'sphinx') {
    clientId = process.env.NOTION_SPHINX_CLIENT_ID || process.env.NOTION_CLIENT_ID;
    clientSecret = process.env.NOTION_SPHINX_CLIENT_SECRET || process.env.NOTION_CLIENT_SECRET;
    redirectUri = process.env.NOTION_SPHINX_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/sphinx`;
  } else if (tool === 'pdf') {
    clientId = process.env.NOTION_PDF_CLIENT_ID || process.env.NOTION_CLIENT_ID;
    clientSecret = process.env.NOTION_PDF_CLIENT_SECRET || process.env.NOTION_CLIENT_SECRET;
    redirectUri = process.env.NOTION_PDF_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/pdf`;
  } else if (tool === 'mail') {
    clientId = process.env.NOTION_MAIL_CLIENT_ID || process.env.NOTION_CLIENT_ID;
    clientSecret = process.env.NOTION_MAIL_CLIENT_SECRET || process.env.NOTION_CLIENT_SECRET;
    redirectUri = process.env.NOTION_MAIL_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/mail`;
  } else if (tool === 'social') {
    clientId = process.env.NOTION_SOCIAL_CLIENT_ID || process.env.NOTION_CLIENT_ID;
    clientSecret = process.env.NOTION_SOCIAL_CLIENT_SECRET || process.env.NOTION_CLIENT_SECRET;
    redirectUri = process.env.NOTION_SOCIAL_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/social`;
  } else {
    // Fallback to general keys
    clientId = process.env.NOTION_CLIENT_ID;
    clientSecret = process.env.NOTION_CLIENT_SECRET;
    redirectUri = process.env.NOTION_REDIRECT_URI;
  }

  if (!clientId || !clientSecret) {
    console.error(`Missing client credentials for tool: ${tool}`);
    return NextResponse.redirect(new URL('/?error=missing_credentials', request.url));
  }

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
      console.error(`Error exchanging token for ${tool}:`, tokenData);
      return NextResponse.redirect(new URL('/?error=token_exchange_failed', request.url));
    }

    const user = await getCurrentUser();

    // Extract connected workspace details
    // We store with a tool-specific suffix so each integration has its own isolated token
    const account = {
      workspace_id: `${tokenData.workspace_id}_${tool}`,
      workspace_name: tokenData.workspace_name,
      workspace_icon: tokenData.workspace_icon,
      access_token: tokenData.access_token,
      bot_id: tokenData.bot_id,
      owner: tokenData.owner,
      tool: tool,
      user_id: user?.id || null,
      connected_at: new Date().toISOString(),
    };

    // Save to our lightweight database (keyed by workspace_id_tool)
    await saveAccount(account);

    // Redirect to the specific tool page after connection
    const toolPath = tool === 'qr' ? '/dashboard/qr' : tool === 'forms' ? '/dashboard/forms' : tool === 'charts' ? '/dashboard/charts' : tool === 'publisher' ? '/dashboard/publisher' : tool === 'sphinx' ? '/dashboard/sphinx' : tool === 'pdf' ? '/dashboard/pdf' : tool === 'mail' ? '/dashboard/mail' : tool === 'social' ? '/dashboard/social' : '/dashboard';
    const response = NextResponse.redirect(new URL(toolPath, request.url));
    
    // Set secure cookie with the RAW Notion workspace ID (no tool suffix)
    // The tool pages use: getAccount(`${workspaceId}_qr`), getAccount(`${workspaceId}_forms`), getAccount(`${workspaceId}_charts`), getAccount(`${workspaceId}_publisher`)
    response.cookies.set('tjesa_workspace_id', tokenData.workspace_id, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err) {
    console.error(`OAuth Callback Exception for ${tool}:`, err);
    return NextResponse.redirect(new URL('/?error=server_exception', request.url));
  }
}
