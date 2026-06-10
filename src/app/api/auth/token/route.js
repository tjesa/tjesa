import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { saveAccount } from '@/lib/db';
import { getCurrentUser } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Initialize Notion Client with the manually provided token
    const notion = new Client({ auth: token });
    
    // Verify token validity by calling users.me()
    const botUser = await notion.users.me();

    // Extract workspace details
    const workspaceName = botUser.bot?.workspace_name || botUser.name || 'Sacred Workspace';
    const workspaceId = botUser.id || 'token_' + Math.random().toString(36).substring(2, 9);

    const user = await getCurrentUser();

    const account = {
      workspace_id: workspaceId,
      workspace_name: workspaceName,
      workspace_icon: botUser.avatar_url || null,
      access_token: token,
      bot_id: botUser.id,
      owner: botUser.bot?.owner || { type: 'workspace', workspace: true },
      user_id: user?.id || null,
      connected_at: new Date().toISOString(),
    };

    // Save the credentials to our local database
    await saveAccount(account);

    // Establish the session cookie
    const response = NextResponse.json({ success: true, workspace_id: workspaceId });
    
    response.cookies.set('tjesa_workspace_id', workspaceId, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
      domain: process.env.NODE_ENV === 'production' ? '.tjesa.com' : undefined,
    });

    return response;
  } catch (error) {
    console.error('Manual Token validation failed:', error);
    return NextResponse.json({ 
      error: 'Invalid token or connection error. Make sure your integration is added to the Notion workspace.' 
    }, { status: 400 });
  }
}
