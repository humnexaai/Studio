#!/usr/bin/env bash
set -euo pipefail

# Push .env.local values to Vercel production environment variables.
# Usage:
#   ./scripts/setup-vercel-env.sh
#   ./scripts/setup-vercel-env.sh /path/to/.env.local

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROJECT_DIR="${REPO_ROOT}"
if [[ -d "${REPO_ROOT}/humnexa-studio" ]]; then
  PROJECT_DIR="${REPO_ROOT}/humnexa-studio"
fi

if [[ $# -gt 0 ]]; then
  ENV_FILE="$1"
elif [[ -f "${REPO_ROOT}/.env.local" ]]; then
  ENV_FILE="${REPO_ROOT}/.env.local"
elif [[ -f "${PROJECT_DIR}/.env.local" ]]; then
  ENV_FILE="${PROJECT_DIR}/.env.local"
else
  ENV_FILE="${REPO_ROOT}/.env.local"
fi

if ! command -v vercel >/dev/null 2>&1; then
  echo "Error: Vercel CLI is not installed. Install it with: npm i -g vercel" >&2
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Error: Environment file not found at ${ENV_FILE}" >&2
  exit 1
fi

cd "${PROJECT_DIR}"

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

required_vars=(
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  GROQ_API_KEY
  ANTHROPIC_API_KEY
  OPENAI_API_KEY
  RESEND_API_KEY
  RESEND_FROM_EMAIL
  RAZORPAY_KEY_ID
  RAZORPAY_KEY_SECRET
  NEXT_PUBLIC_RAZORPAY_KEY_ID
  GITHUB_CLIENT_ID
  GITHUB_CLIENT_SECRET
  GITHUB_TOKEN
  NEXTAUTH_SECRET
  NEXTAUTH_URL
  NEXT_PUBLIC_APP_URL
  NEXT_PUBLIC_SENTRY_DSN
)

for var_name in "${required_vars[@]}"; do
  var_value="${!var_name:-}"
  if [[ -z "${var_value}" ]]; then
    echo "Error: ${var_name} is empty or missing in ${ENV_FILE}" >&2
    exit 1
  fi

  echo "Adding ${var_name} to Vercel production environment..."
  printf "%s" "${var_value}" | vercel env add "${var_name}" production
done

echo "All required environment variables were added to Vercel production."
