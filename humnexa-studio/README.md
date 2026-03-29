# Humnexa Studio

**Idea to App to Launch to Earn.**

## What is Humnexa Studio

Humnexa Studio is India's first universal AI-powered app builder. It helps builders go from a raw idea to a working app, then to deployment and monetization, with one workspace for chat, code, preview, and launch workflows.

Built by **PLATINUMGOLD Partnership Firm**.

## Features

- AI chat to app generation
- Live preview while editing
- India Stack integrations (UPI, GST, WhatsApp)
- 40+ language support
- Hindi mode support
- Credits system with usage controls
- GitHub push and Vercel deployment
- Plan Mode for free brainstorming
- Visual editor workflow

## Tech Stack

- Next.js 14
- Supabase
- Groq AI
- Sandpack
- Monaco Editor
- Razorpay
- Sentry
- Zustand
- Framer Motion

## Local Development

1. Clone the repo.
2. Copy `.env.example` to `.env.local`.
3. Fill all required environment variables.
4. Install dependencies:
   ```bash
   npm install
   ```
5. Run Supabase SQL from `supabase/schema.sql`.
6. Start the dev server:
   ```bash
   npm run dev
   ```
7. Open `http://localhost:3000`.

## Environment Variables

From `.env.example`, configure:

- `NEXT_PUBLIC_SUPABASE_URL`: Public Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key for client access.
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key for server/admin actions.
- `GROQ_API_KEY`: Groq API key for primary AI model routing.
- `GROQ_MODEL`: Groq model name.
- `ANTHROPIC_API_KEY`: Anthropic API key for fallback model routing.
- `ANTHROPIC_MODEL`: Anthropic model name.
- `OPENAI_API_KEY`: OpenAI API key for fallback model routing.
- `OPENAI_MODEL`: OpenAI model name.
- `RESEND_API_KEY`: Resend API key for email delivery.
- `RESEND_FROM_EMAIL`: Sender email for outbound emails.
- `RAZORPAY_KEY_ID`: Razorpay key ID for server-side payment operations.
- `RAZORPAY_KEY_SECRET`: Razorpay key secret for signing and order APIs.
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`: Public Razorpay key ID for client checkout.
- `GITHUB_CLIENT_ID`: GitHub OAuth app client ID.
- `GITHUB_CLIENT_SECRET`: GitHub OAuth app client secret.
- `GITHUB_TOKEN`: GitHub token for repository push operations.
- `VERCEL_TOKEN`: Vercel access token for deployment APIs.
- `VERCEL_TEAM_ID`: Optional Vercel team identifier.
- `NEXT_PUBLIC_SENTRY_DSN`: Public Sentry DSN for client/server error reporting.
- `NEXT_PUBLIC_APP_URL`: Public base URL for app links and metadata.
- `NEXTAUTH_SECRET`: NextAuth signing secret.
- `NEXTAUTH_URL`: NextAuth application URL.
- `ENABLE_VISUAL_EDIT`: Feature flag for visual editing.
- `ENABLE_PLAN_MODE`: Feature flag for plan mode.
- `ENABLE_HINDI_MODE`: Feature flag for Hindi mode.
- `ENABLE_FLUTTER`: Feature flag for Flutter generation paths.

## Deploy

1. Push your code to GitHub.
2. Import the repository into Vercel.
3. Add all environment variables from `.env.example` in Vercel project settings.
4. Trigger deployment.
5. Verify Supabase, payment, and Sentry integrations in production.

## License

Proprietary. Copyright 2026 PLATINUMGOLD Partnership Firm.
