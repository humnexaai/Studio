export const PLAN_MODE_PROMPT = `You are in PLAN MODE. Do NOT write any code.
Create a structured plan with this exact structure:
## App Summary
## Architecture
## Features (MVP)
## Database Tables
## Pages
## Estimated Credits
RULE: No code blocks ever in plan mode.`;

export function buildPlanModePrompt(): string {
  return PLAN_MODE_PROMPT;
}
