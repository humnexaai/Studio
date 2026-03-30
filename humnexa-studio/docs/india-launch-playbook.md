# India SaaS Launch Playbook (Humnexa Studio)

This document captures the implementation status and operational checklist for launching Humnexa Studio as an India-first SaaS platform.

## 1) Supabase Production Hardening

- RLS enabled across public schema tables.
- Policies split by action in critical tables and helper access functions used to centralize checks.
- RLS predicate indexes added for ownership/collaboration lookups.
- `auth.uid()` wrapped as `(select auth.uid())` in key policies for planner caching.
- Server-side Supabase URLs updated to support PgBouncer-aware connection handling.
- Auth bootstrap trigger (`on_auth_user_created`) present.
- Added webhook idempotency table (`processed_webhook_events`).
- Action item (console): confirm PITR, SMTP, SSL/network restrictions in Supabase dashboard.

## 2) Razorpay Webhooks and Subscription Lifecycle

- Raw-body HMAC verification (`x-razorpay-signature`) implemented.
- Event matrix coverage includes payment, subscription, and refund classes.
- Idempotency check records webhook IDs in `processed_webhook_events`.
- UPI AutoPay subscription creation endpoint implemented (`/api/payments/create-subscription`).
- Subscription cancellation endpoint implemented (`/api/subscriptions/[id]/cancel`).

## 3) GST Invoice Compliance

- GST invoice generator utility implemented in `src/lib/billing/gst-invoice.ts`.
- Printable GST invoice component implemented in `src/components/india/GSTInvoice.tsx`.
- Billing UI supports invoice modal/download flow for eligible purchase rows.

## 4) Legal and Compliance Pages

- Terms, Privacy, Refund, and Grievance pages implemented and linked in UI surfaces.
- India-specific legal language added for grievance process and policy clarity.

## 5) OWASP-Oriented Security Controls

- Middleware security headers and nonce-based CSP in place.
- Route and middleware rate limits implemented on auth, chat, payments, and webhooks.
- Honeypot protection implemented for signup/password-reset flows.
- API catch blocks instrumented with Sentry in critical routes.

## 6) Performance and Core Web Vitals

- Bundle analyzer support added.
- Heavy components use dynamic import where relevant.
- ISR configured for public content pages.
- Web vitals reporter hooked into app providers.
- Mumbai region pinning (`preferredRegion = "bom1"`) applied to critical endpoints.

## 7) SEO Foundations

- Root metadata includes Open Graph/Twitter defaults.
- JSON-LD (`WebApplication`, `Organization`) included on landing.
- Sitemap and robots routes updated for marketing/legal pages and protected route disallow rules.
- Comparison pages for `/vs/lovable` and `/vs/bolt` added.

## 8) India Moat Features

- UPI AutoPay subscription path integrated.
- Student plan flow represented in app/billing structures.
- Low-bandwidth mode persisted and respected in studio behavior.

## 9) Monitoring and Analytics

- Sentry initialized (client/server/edge) and user context sync component added.
- PostHog client/server helpers and event capture paths integrated.
- Health endpoint (`/api/health`) and status page (`/status`) implemented.

## 10) Transactional Email

- Resend-backed send wrapper and templates for key lifecycle emails added.
- Payment success/failure and credits-low pathways integrated.

## Final Verification Checklist

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run test`

## Known Residual Risk Notes

- `npm audit` still reports high-severity advisories in transitive/upstream chains
  (notably `next-pwa` workbox serializer path and Next major-line advisories requiring breaking upgrades).
- Plan: migrate from `next-pwa` to a maintained service-worker stack and schedule framework major upgrade testing.
