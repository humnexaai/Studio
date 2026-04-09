#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const REQUIRED_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const PLACEHOLDER_MARKERS = [
  "your_",
  "YOUR_",
  "placeholder",
  "changeme",
  "<",
];

function parseDotEnv(filePath) {
  const parsed = {};
  if (!existsSync(filePath)) return parsed;
  const source = readFileSync(filePath, "utf8");
  const lines = source.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator <= 0) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    parsed[key] = value;
  }
  return parsed;
}

function isUnsetOrPlaceholder(value) {
  if (!value) return true;
  const normalized = value.trim();
  if (!normalized) return true;
  const lower = normalized.toLowerCase();
  return PLACEHOLDER_MARKERS.some((marker) => lower.includes(marker.toLowerCase()));
}

function loadEnv() {
  const cwd = process.cwd();
  const envLocal = parseDotEnv(resolve(cwd, ".env.local"));
  const envBase = parseDotEnv(resolve(cwd, ".env"));
  return {
    ...envBase,
    ...envLocal,
    ...process.env,
  };
}

function main() {
  const env = loadEnv();
  const missing = REQUIRED_KEYS.filter((key) => isUnsetOrPlaceholder(env[key]));
  const url = env.NEXT_PUBLIC_SUPABASE_URL;

  if (missing.length > 0) {
    console.error("Supabase env validation failed.");
    for (const key of missing) {
      console.error(`- ${key} is missing or still set to a placeholder value`);
    }
    process.exit(1);
  }

  try {
    new URL(url);
  } catch {
    console.error("NEXT_PUBLIC_SUPABASE_URL is not a valid URL.");
    process.exit(1);
  }

  console.log("Supabase env validation passed.");
}

main();
