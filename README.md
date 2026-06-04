# Tjesa — Notion-Integrated SaaS Tools

A full-stack Next.js SaaS platform with dedicated Notion integrations for productivity automation.

## Tools

### ◫ Glyph Carver — QR Code Generator
Automatically generates QR codes for URLs in your Notion databases and writes them back as file attachments. Supports full sync, checkbox triggers, select/status triggers, and on-demand webhook mode.

### 📋 Nile Scribe — Web Form Builder
Create public web forms from any Notion database schema. Map columns to form inputs, collect responses, and embed the form anywhere with an `<iframe>`.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: File-based JSON (`db.json`) — swap to Upstash Redis for production
- **Auth**: Notion OAuth 2.0 (separate integration per tool)
- **Notion SDK**: `@notionhq/client`

## Setup

1. Clone the repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env.local` with your Notion integration keys:
   ```env
   NOTION_CLIENT_ID=
   NOTION_CLIENT_SECRET=
   NOTION_REDIRECT_URI=http://localhost:3000/api/auth/callback

   NOTION_QR_CLIENT_ID=
   NOTION_QR_CLIENT_SECRET=
   NOTION_QR_REDIRECT_URI=http://localhost:3000/api/auth/callback/qr

   NOTION_FORMS_CLIENT_ID=
   NOTION_FORMS_CLIENT_SECRET=
   NOTION_FORMS_REDIRECT_URI=http://localhost:3000/api/auth/callback/forms

   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```

## Notion Integration Setup

Each tool requires its **own** Notion integration with its own Client ID and Client Secret. Set the redirect URIs in each integration's settings to match your deployment domain.

| Tool | Redirect URI path |
|------|------------------|
| QR Generator | `/api/auth/callback/qr` |
| Form Builder | `/api/auth/callback/forms` |

## Deployment

For production deployment, replace `db.json` with a persistent database (e.g. Upstash Redis) since serverless platforms have ephemeral filesystems. See deployment docs for Vercel/Render setup.
