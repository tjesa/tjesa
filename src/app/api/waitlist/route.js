import { NextResponse } from 'next/server';
import { saveWaitlist } from '@/lib/db';

export async function POST(request) {
  try {
    const { 
      email, 
      name, 
      excitedTool, 
      utm_source = '', 
      utm_medium = '', 
      utm_campaign = '' 
    } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email address format.' }, { status: 400 });
    }

    await saveWaitlist(
      email.trim(), 
      name || '', 
      excitedTool || '', 
      utm_source || '', 
      utm_medium || '', 
      utm_campaign || ''
    );

    // Sync to Brevo if credentials exist
    const brevoApiKey = process.env.BREVO_API_KEY;
    const brevoListId = process.env.BREVO_LIST_ID;
    const brevoTemplateId = process.env.BREVO_TEMPLATE_ID;

    if (brevoApiKey) {
      try {
        if (brevoListId) {
          // Mode A: Add contact to List (triggers Brevo automation workflow)
          const listResponse = await fetch('https://api.brevo.com/v3/contacts', {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'api-key': brevoApiKey,
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              email: email.trim(),
              listIds: [parseInt(brevoListId)],
              attributes: {
                FIRSTNAME: name ? name.split(' ')[0] : '',
                FULLNAME: name || '',
                EXCITED_TOOL: excitedTool || '',
                UTM_SOURCE: utm_source || '',
                UTM_MEDIUM: utm_medium || '',
                UTM_CAMPAIGN: utm_campaign || ''
              },
              updateEnabled: true
            })
          });

          if (!listResponse.ok) {
            const errBody = await listResponse.json();
            console.warn('[Brevo API] Contact list sync warning:', errBody);
          }
        }

        if (brevoTemplateId) {
          // Mode B: Send transactional email template directly from the code
          const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'api-key': brevoApiKey,
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              to: [{ email: email.trim(), name: name || '' }],
              templateId: parseInt(brevoTemplateId),
              params: {
                FIRSTNAME: name ? name.split(' ')[0] : '',
                FULLNAME: name || '',
                EXCITED_TOOL: excitedTool || '',
                UTM_SOURCE: utm_source || '',
                UTM_MEDIUM: utm_medium || '',
                UTM_CAMPAIGN: utm_campaign || ''
              }
            })
          });

          if (!emailResponse.ok) {
            const errBody = await emailResponse.json();
            console.warn('[Brevo API] Transactional email send warning:', errBody);
          }
        }
      } catch (brevoErr) {
        console.error('[Brevo Error] Integration failure:', brevoErr);
        // Do not crash the waitlist signup if Brevo API fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Email successfully registered to the waitlist.'
    });
  } catch (error) {
    if (error.message === 'Email already registered') {
      return NextResponse.json({ error: 'This email is already registered in the archives.' }, { status: 400 });
    }
    console.error('Waitlist submission error:', error);
    return NextResponse.json({ error: 'Failed to join waitlist: ' + error.message }, { status: 500 });
  }
}
