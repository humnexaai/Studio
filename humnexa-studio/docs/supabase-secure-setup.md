# Secure Supabase Setup (Go-Live)

This guide configures Supabase without embedding secrets in source code.

## Security model

- **Never** hardcode secrets in `src/` or commit `.env.local`.
- Public keys are read from environment:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Server-only secret stays server-side:
  - `SUPABASE_SERVICE_ROLE_KEY`
- Runtime checks fail fast when required values are missing/placeholder.

## Required resources

Before testing, prepare:

1. Supabase project URL (from Project Settings > API)
2. Supabase anon key (public)
3. Supabase service role key (secret)
4. Database schema pushed to the project (`supabase/schema.sql` or migration flow)

## Local setup

1. Copy env file:

```bash
cp .env.example .env.local
```

2. Fill these values in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

3. Validate env values:

```bash
npm run env:check
```

4. Verify actual Supabase connectivity:

```bash
npm run supabase:check
```

Expected result:
- service role can query `plans`
- anon key can reach Supabase API

## Test execution

Run these checks in order from repository root:

```bash
npm run env:check
npm run supabase:check
npm run typecheck
npm run lint
npm run test
npm run build
```

## Deployment testing

For Vercel/production:

1. Add the same 3 keys in Vercel Environment Variables (Production/Preview).
2. Redeploy.
3. Validate:
   - `/api/health` responds with `supabase_connected: true`
   - auth flow works (`/auth`)
   - protected routes load for authenticated users.

## Secret handling policy

- Rotate `SUPABASE_SERVICE_ROLE_KEY` immediately if leaked.
- Use separate Supabase projects/keys per environment (dev/stage/prod).
- Restrict access to production envs in Vercel/Supabase dashboard roles.
