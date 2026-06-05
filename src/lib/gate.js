export function validateGateSession(sessionToken, config) {
  if (!config || !config.settings || !config.settings.gate_active) {
    return true; // No gate configured
  }

  if (!sessionToken) {
    return false; // Gated but no session token
  }

  try {
    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
    const gateType = config.settings.gate_type || 'password';
    const gatePassword = config.settings.gate_password;

    if (gateType === 'email_whitelist') {
      const parts = decoded.split(':');
      if (parts.length !== 3) return false;
      const [email, configId, password] = parts;
      
      if (configId !== config.id) return false;
      if (password !== gatePassword) return false;
      
      const cleanEmail = email.trim().toLowerCase();
      const allowedEmails = config.settings.gate_allowed_emails
        ? config.settings.gate_allowed_emails.split(',').map(e => e.trim().toLowerCase())
        : [];
      return allowedEmails.includes(cleanEmail);
    } else {
      const parts = decoded.split(':');
      if (parts.length !== 2) return false;
      const [configId, password] = parts;
      
      return configId === config.id && password === gatePassword;
    }
  } catch (err) {
    console.error('[gate] Session validation exception:', err);
    return false;
  }
}
