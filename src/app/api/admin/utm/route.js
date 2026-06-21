import { NextResponse } from 'next/server';
import { getUtmLinks, saveUtmLink, deleteUtmLink } from '@/lib/db';
import { getCurrentUser } from '@/lib/supabase/server';

// Helper to verify admin privileges
async function verifyAdmin() {
  const user = await getCurrentUser();
  if (!user || !(user.email === 'developer@tjesa.com' || user.email === 'hazemyasser911@gmail.com' || user.email?.endsWith('@tjesa.com'))) {
    return false;
  }
  return true;
}

export async function GET(request) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin portal closed' }, { status: 403 });
  }

  try {
    const links = await getUtmLinks();
    return NextResponse.json({
      success: true,
      links
    });
  } catch (error) {
    console.error('Error fetching UTM links:', error);
    return NextResponse.json({ error: 'Failed to retrieve UTM links: ' + error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin portal closed' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { url, utm_source, utm_medium, utm_campaign, utm_term = '', utm_content = '' } = body;

    // Validation
    if (!url || !utm_source || !utm_medium || !utm_campaign) {
      return NextResponse.json({ error: 'Missing required UTM parameters: url, source, medium, and campaign are required.' }, { status: 400 });
    }

    try {
      new URL(url);
    } catch (_) {
      return NextResponse.json({ error: 'Invalid base URL format.' }, { status: 400 });
    }

    const utmLink = {
      url: url.trim(),
      utm_source: utm_source.trim(),
      utm_medium: utm_medium.trim(),
      utm_campaign: utm_campaign.trim(),
      utm_term: utm_term.trim(),
      utm_content: utm_content.trim()
    };

    const savedLink = await saveUtmLink(utmLink);
    return NextResponse.json({
      success: true,
      link: savedLink
    });
  } catch (error) {
    console.error('Error saving UTM link:', error);
    return NextResponse.json({ error: 'Failed to save UTM link: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin portal closed' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing UTM link ID.' }, { status: 400 });
    }

    await deleteUtmLink(id);
    return NextResponse.json({
      success: true,
      message: 'UTM link successfully deleted.'
    });
  } catch (error) {
    console.error('Error deleting UTM link:', error);
    return NextResponse.json({ error: 'Failed to delete UTM link: ' + error.message }, { status: 500 });
  }
}
