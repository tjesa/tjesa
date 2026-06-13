import { NextResponse } from 'next/server';
import { getCurrentUser, createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { getAccountsForUser, deleteAccount, deleteConfig, getConfigs } from '@/lib/db';

export async function DELETE(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // 1. Get all accounts connected to this user
    const userAccounts = await getAccountsForUser(userId);

    // 2. Delete all configs and accounts associated with this user's workspaces
    for (const account of userAccounts) {
      // Find all configs for this specific workspace_id
      const configs = await getConfigs(account.workspace_id);
      for (const config of configs) {
        await deleteConfig(config.id);
      }
      // Delete the account itself
      await deleteAccount(account.workspace_id);
    }

    // 3. Clear Supabase session on the server side
    const supabaseServer = await createServerClient();
    await supabaseServer.auth.signOut();

    // 4. Delete user from Supabase Auth if not in developer bypass mode and service role key is present
    if (userId !== '00000000-0000-0000-0000-000000000000') {
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseKey) {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabaseKey
        );
        const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteUserError) {
          console.error('[DeleteAccount] Supabase deleteUser admin error:', deleteUserError);
          // If we fail to delete from auth, still clear client cookies so they can start fresh
        }
      } else {
        console.warn('[DeleteAccount] Missing SUPABASE_SERVICE_ROLE_KEY. Auth user deletion skipped.');
      }
    }

    // 5. Create response and clear client cookies
    const response = NextResponse.json({ success: true });
    const cookieDomain = process.env.NODE_ENV === 'production' ? '.tjesa.com' : undefined;

    response.cookies.set('tjesa_workspace_id', '', { path: '/', maxAge: 0, domain: cookieDomain });
    response.cookies.set('tjesa_bypass_active', '', { path: '/', maxAge: 0, domain: cookieDomain });

    return response;
  } catch (err) {
    console.error('Delete Account API Error:', err);
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}
