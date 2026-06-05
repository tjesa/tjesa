import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import nodemailer from 'nodemailer';
import { getAccount, getConfig, saveConfig } from '@/lib/db';

function compileTemplate(template, properties) {
  if (!template) return '';
  return template.replace(/\{\{(.*?)\}\}/g, (match, propName) => {
    const key = propName.trim();
    if (properties[key]) {
      const prop = properties[key];
      if (prop.type === 'title') {
        return prop.title?.map(t => t.plain_text).join('') || '';
      } else if (prop.type === 'rich_text') {
        return prop.rich_text?.map(t => t.plain_text).join('') || '';
      } else if (prop.type === 'email') {
        return prop.email || '';
      } else if (prop.type === 'phone_number') {
        return prop.phone_number || '';
      } else if (prop.type === 'url') {
        return prop.url || '';
      } else if (prop.type === 'select') {
        return prop.select?.name || '';
      } else if (prop.type === 'status') {
        return prop.status?.name || '';
      } else if (prop.type === 'number') {
        return prop.number !== null ? String(prop.number) : '';
      }
    }
    return '';
  });
}

export async function POST(request) {
  const workspaceId = request.cookies.get('tjesa_workspace_id')?.value;

  if (!workspaceId) {
    return NextResponse.json({ error: 'Unauthorized: No active gateway' }, { status: 401 });
  }

  try {
    const { configId, pageIds = [] } = await request.json();

    if (!configId || pageIds.length === 0) {
      return NextResponse.json({ error: 'Missing configuration ID or target contact page list' }, { status: 400 });
    }

    // 1. Fetch Configuration
    const config = await getConfig(configId);
    if (!config || (config.workspace_id !== `${workspaceId}_mail` && config.workspace_id !== workspaceId)) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    const settings = config.settings || {};
    const {
      smtp_host,
      smtp_port,
      smtp_user,
      smtp_pass,
      smtp_from_email,
      smtp_from_name,
      use_sandbox = true,
      column_email,
      column_name,
      column_status,
      status_sent_value = 'Sent',
      email_subject,
      email_body
    } = settings;

    if (!column_email || !email_subject || !email_body) {
      return NextResponse.json({ error: 'Configuration is missing required columns or templates' }, { status: 400 });
    }

    // 2. Fetch Notion Credentials
    let account = await getAccount(config.workspace_id);
    if (!account) {
      const baseWorkspaceId = config.workspace_id.replace('_mail', '');
      account = await getAccount(baseWorkspaceId);
    }

    if (!account || !account.access_token) {
      return NextResponse.json({ error: 'Notion connection credentials not found' }, { status: 404 });
    }

    const notion = new Client({ auth: account.access_token });

    // 3. Setup Email Delivery Engine
    let transporter = null;
    if (!use_sandbox) {
      if (!smtp_host || !smtp_port || !smtp_user || !smtp_pass) {
        return NextResponse.json({ error: 'SMTP connection parameters are incomplete' }, { status: 400 });
      }
      transporter = nodemailer.createTransport({
        host: smtp_host,
        port: parseInt(smtp_port),
        secure: parseInt(smtp_port) === 465,
        auth: {
          user: smtp_user,
          pass: smtp_pass
        }
      });
    }

    let successCount = 0;
    let failedCount = 0;
    const logs = [];

    // 4. Loop over requested contacts and send mail
    for (const pageId of pageIds) {
      try {
        // A. Retrieve Page Properties from Notion
        const page = await notion.pages.retrieve({ page_id: pageId });
        const props = page.properties || {};

        // B. Extract recipient Email
        let recipientEmail = '';
        if (props[column_email]) {
          const p = props[column_email];
          if (p.type === 'email') recipientEmail = p.email || '';
          else if (p.type === 'url') recipientEmail = p.url || '';
          else if (p.type === 'rich_text') recipientEmail = p.rich_text?.map(t => t.plain_text).join('') || '';
        }

        if (!recipientEmail || !recipientEmail.includes('@')) {
          throw new Error('Contact does not possess a valid email address.');
        }

        // C. Compile personalized text
        const subject = compileTemplate(email_subject, props);
        const body = compileTemplate(email_body, props);

        // D. Disptach
        if (use_sandbox) {
          console.log(`[SANDBOX MAIL] From: "${smtp_from_name || 'Tjesa Courier'}" <${smtp_from_email || 'courier@tjesa.com'}>`);
          console.log(`[SANDBOX MAIL] To: ${recipientEmail}`);
          console.log(`[SANDBOX MAIL] Subject: ${subject}`);
          console.log(`[SANDBOX MAIL] Body:\n${body}\n`);
          logs.push({ pageId, email: recipientEmail, status: 'sandbox_sent', subject });
        } else {
          await transporter.sendMail({
            from: `"${smtp_from_name || 'The Royal Messenger'}" <${smtp_from_email || smtp_user}>`,
            to: recipientEmail,
            subject: subject,
            text: body,
            html: body.replace(/\n/g, '<br />')
          });
          logs.push({ pageId, email: recipientEmail, status: 'smtp_sent', subject });
        }

        // E. Sync Status Back to Notion
        if (column_status && props[column_status]) {
          const targetPropDesc = props[column_status];
          let updateProp = null;

          if (targetPropDesc.type === 'checkbox') {
            updateProp = { checkbox: true };
          } else if (targetPropDesc.type === 'select') {
            updateProp = { select: { name: status_sent_value } };
          } else if (targetPropDesc.type === 'status') {
            updateProp = { status: { name: status_sent_value } };
          } else if (targetPropDesc.type === 'rich_text') {
            updateProp = {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: status_sent_value
                  }
                }
              ]
            };
          }

          if (updateProp) {
            await notion.pages.update({
              page_id: pageId,
              properties: {
                [column_status]: updateProp
              }
            });
          }
        }

        successCount++;
      } catch (err) {
        failedCount++;
        logs.push({ pageId, status: 'failed', error: err.message });
        console.error(`Failed to dispatch email to page ${pageId}:`, err);
      }
    }

    // 5. Update Config sync stats
    const updatedConfig = await saveConfig({
      ...config,
      last_sync: new Date().toISOString(),
      last_sync_success_count: (config.last_sync_success_count || 0) + successCount,
      last_sync_total_count: (config.last_sync_total_count || 0) + pageIds.length
    });

    return NextResponse.json({
      success: true,
      stats: {
        total: pageIds.length,
        dispatched: successCount,
        failed: failedCount
      },
      config: updatedConfig,
      logs
    });
  } catch (error) {
    console.error('Mail Send Dispatch Exception:', error);
    return NextResponse.json({ error: 'Failed to complete mail dispatch: ' + error.message }, { status: 500 });
  }
}
