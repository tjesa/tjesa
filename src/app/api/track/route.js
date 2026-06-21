import { NextResponse } from 'next/server';
import { recordPageview } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { referrer, utm_source, utm_medium, utm_campaign, path } = body;
    const country = request.headers.get('x-vercel-ip-country') || 'Unknown';

    await recordPageview({
      referrer,
      utmSource: utm_source,
      utmMedium: utm_medium,
      utmCampaign: utm_campaign,
      country
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Track API Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
