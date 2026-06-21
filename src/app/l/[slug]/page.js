import { redirect } from 'next/navigation';
import { getUtmLinks, recordPageview } from '@/lib/db';
import { headers } from 'next/headers';

export default async function LinkRedirect({ params }) {
  const { slug } = await params;
  
  // Find matching UTM link in db
  const links = await getUtmLinks();
  const link = links.find(l => l.id === slug);

  if (!link) {
    redirect('/');
  }

  // Record hit automatically in background
  try {
    const headersList = await headers();
    const country = headersList.get('x-vercel-ip-country') || 'Unknown';
    const referrer = headersList.get('referer') || 'Direct / Organic';
    
    // Clean referrer hostname
    let referrerHost = 'Direct / Organic';
    if (referrer && referrer !== 'Direct / Organic') {
      try {
        referrerHost = new URL(referrer).hostname;
      } catch (_) {
        referrerHost = referrer;
      }
    }

    await recordPageview({
      referrer: referrerHost,
      utmSource: link.utm_source,
      utmMedium: link.utm_medium,
      utmCampaign: link.utm_campaign,
      country
    });
  } catch (err) {
    console.error('[ShortLink Redirect Tracking Error]', err);
  }

  // Construct target URL with UTM parameters
  let targetUrl = link.url;
  try {
    const urlObj = new URL(targetUrl);
    if (link.utm_source) urlObj.searchParams.set('utm_source', link.utm_source);
    if (link.utm_medium) urlObj.searchParams.set('utm_medium', link.utm_medium);
    if (link.utm_campaign) urlObj.searchParams.set('utm_campaign', link.utm_campaign);
    if (link.utm_term) urlObj.searchParams.set('utm_term', link.utm_term);
    if (link.utm_content) urlObj.searchParams.set('utm_content', link.utm_content);
    targetUrl = urlObj.toString();
  } catch (_) {
    // Fallback if base URL isn't fully formed
    if (targetUrl.startsWith('/')) {
      const queryStr = new URLSearchParams({
        utm_source: link.utm_source || '',
        utm_medium: link.utm_medium || '',
        utm_campaign: link.utm_campaign || '',
        utm_term: link.utm_term || '',
        utm_content: link.utm_content || ''
      }).toString();
      targetUrl = `${targetUrl}?${queryStr}`;
    }
  }

  redirect(targetUrl);
}
