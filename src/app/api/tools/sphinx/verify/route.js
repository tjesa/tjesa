import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/db';

export async function POST(request) {
  try {
    const { configId, password, email } = await request.json();

    if (!configId || !password) {
      return NextResponse.json({ error: 'Missing required validation credentials' }, { status: 400 });
    }

    // 1. Fetch the configuration
    const config = await getConfig(configId);
    if (!config) {
      return NextResponse.json({ error: 'Configuration portal not found' }, { status: 404 });
    }

    const settings = config.settings || {};
    const {
      gate_active: gateActive,
      gate_type: gateType = 'password',
      gate_password: gatePassword,
      gate_allowed_emails: gateAllowedEmails = ''
    } = settings;

    // If gate is not active, return success immediately
    if (!gateActive) {
      return NextResponse.json({ success: true });
    }

    // 2. Validate password
    if (password !== gatePassword) {
      return NextResponse.json({ error: 'Incorrect gate access credentials' }, { status: 401 });
    }

    // 3. Validate email whitelist if type is client portal
    const cleanEmail = email?.trim().toLowerCase();
    if (gateType === 'email_whitelist') {
      if (!cleanEmail) {
        return NextResponse.json({ error: 'An authorized email address is required' }, { status: 400 });
      }

      const allowedList = gateAllowedEmails
        ? gateAllowedEmails.split(',').map(e => e.trim().toLowerCase())
        : [];

      if (!allowedList.includes(cleanEmail)) {
        return NextResponse.json({ error: 'This email is not authorized for access' }, { status: 403 });
      }
    }

    // 4. Generate stateless session token
    const tokenVal = gateType === 'email_whitelist'
      ? `${cleanEmail}:${configId}:${gatePassword}`
      : `${configId}:${gatePassword}`;
      
    const sessionToken = Buffer.from(tokenVal).toString('base64');

    // 5. Issue cookie and return
    const response = NextResponse.json({ success: true });
    response.cookies.set(`tjesa_gate_session_${configId}`, sessionToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error('Error during Sphinx gate verification:', error);
    return NextResponse.json({ error: 'Verification failed: ' + error.message }, { status: 500 });
  }
}
