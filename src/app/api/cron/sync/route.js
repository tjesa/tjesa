import { NextResponse } from 'next/server';
import { pollAndSync } from '@/lib/poller';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const authHeader = request.headers.get('authorization');

  // Verify CRON_SECRET if it's set in the production environment variables
  if (process.env.CRON_SECRET) {
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    console.log('[Cron Sync] Triggering background synchronization...');
    // Await the poller execution fully so the serverless function remains active
    await pollAndSync();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Synchronization triggered and completed successfully' 
    });
  } catch (error) {
    console.error('[Cron Sync Error]:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
