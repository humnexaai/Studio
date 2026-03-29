#!/usr/bin/env bash
set -euo pipefail

# Apply Supabase schema changes from supabase/schema.sql using Supabase CLI.
# Local usage:
#   1) Install Supabase CLI: https://supabase.com/docs/guides/cli
#   2) Authenticate or link your project (if needed): supabase login / supabase link
#   3) Run this script from the repository root:
#      ./scripts/setup-supabase.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if ! command -v supabase >/dev/null 2>&1; then
  echo "Error: Supabase CLI is not installed. Install it first and rerun this script." >&2
  exit 1
fi

cd "${REPO_ROOT}"
supabase db push

echo "Supabase schema push completed."
