# CERT-In Incident Response Runbook

This runbook is the operational checklist for complying with India's CERT-In cyber incident reporting direction (6-hour notification window) and related retention obligations.

## 1) Scope and severity

Treat the following as reportable incidents:

- Unauthorized access, account takeover, privilege escalation.
- Data exfiltration or suspected personal data compromise.
- Ransomware, malware, destructive code execution.
- Infrastructure compromise, cryptomining, supply-chain compromise.
- Payment workflow abuse affecting user funds or subscription integrity.
- Prolonged outage caused by malicious activity.

Severity labels:

- **SEV-1**: Active compromise, payments/data impacted, or platform down.
- **SEV-2**: High-confidence suspicious activity with containment in progress.
- **SEV-3**: Confirmed low-impact incident or credible attempted attack.

## 2) Roles and contact matrix

- **Incident Commander (IC)**: Owns execution timeline.
- **Security Lead**: Triage, forensics coordination, containment strategy.
- **Platform Lead**: Infrastructure, deployment rollback, edge controls.
- **Legal/Compliance**: CERT-In + DPDPA communication review.
- **Comms Lead**: Customer/public status updates.

Internal aliases (configure in company workspace):

- `security-oncall@humnexa.com`
- `platform-oncall@humnexa.com`
- `legal@humnexa.com`
- `grievance@humnexa.com`

## 3) First 30 minutes (contain + preserve evidence)

1. Open incident channel and assign IC.
2. Record timestamp in IST and UTC.
3. Freeze risky deploys:
   - stop auto-deploy if compromise is suspected.
4. Rotate exposed secrets immediately:
   - Supabase service role key
   - AI provider keys
   - Razorpay secrets
   - GitHub/Vercel tokens
5. Isolate impacted surfaces:
   - disable vulnerable endpoint/feature flags.
   - add temporary rate-limit or block rules.
6. Preserve evidence:
   - application logs
   - webhook payload records
   - auth/session events
   - infrastructure audit logs

## 4) Reporting timeline (CERT-In 6-hour rule)

### T+0 to T+60 min

- Validate incident credibility and impact radius.
- Capture minimal report fields:
  - incident category
  - impacted systems
  - first observed timestamp
  - current status and containment actions

### T+60 to T+240 min

- Draft and submit CERT-In notification with available facts.
- Continue evidence collection and containment.
- File internal legal/compliance record for DPDPA linkage.

### T+240 to T+360 min

- Ensure CERT-In submission has been acknowledged.
- Publish customer-facing status note when user-facing impact exists.

## 5) Technical containment checklist (platform-specific)

- Disable or rotate compromised credentials in Vercel and Supabase.
- Revalidate webhook signature verification and idempotency safeguards.
- Apply emergency WAF/rate-limiting on affected APIs (`/api/auth`, `/api/chat`, `/api/payments`, `/api/webhooks`).
- Rollback to last known good deployment if needed.
- Force logout if token/session abuse is suspected.
- Validate RLS protections on impacted tables before restoring traffic.

## 6) Log retention and clock synchronization

- Retain security and access logs for at least 180 days.
- Keep logs accessible in India region for compliance response.
- Ensure all systems use synchronized clocks (NTP) to preserve timeline integrity.

Operational minimum:

- store request IDs with each critical API event.
- keep immutable audit trail for incident decisions and actions.

## 7) Customer and regulator communication

- Provide factual, non-speculative updates.
- Include:
  - what happened
  - affected data/systems
  - immediate mitigations
  - user action required (if any)
- For personal data incidents, align DPDPA-notification process with legal guidance.

## 8) Recovery and verification

Before closing incident:

- threat vector neutralized and verified.
- keys/credentials rotated and old credentials revoked.
- backfill monitoring alerts added for recurrence signals.
- regression tests added for exploited path.

## 9) Post-incident review (within 48 hours)

Produce a postmortem with:

- root cause
- blast radius
- timeline
- detection gaps
- corrective/preventive actions with owners

Track follow-up actions to completion:

- schema/policy fixes
- security test additions
- runbook updates
- training updates for responders

## 10) Quick command checklist

Use these as references during incidents:

- `npm run lint`
- `npm run build`
- `npm run test`
- `npx tsc --noEmit`

For immediate deployment rollback/containment, use platform-native controls in Vercel/Supabase dashboards.
