#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const REQUIRED_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
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

function fail(message) {
  console.error(message);
  process.exit(1);
}

async function main() {
  const env = loadEnv();
  const missing = REQUIRED_KEYS.filter((key) => !env[key] || !env[key].trim());
  if (missing.length > 0) {
    fail(`Missing required env vars: ${missing.join(", ")}`);
  }

  const url = env.NEXT_PUBLIC_SUPABASE_URL.trim();
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim();
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY.trim();

  console.log("Checking Supabase connectivity...");

  const adminClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: adminError } = await adminClient
    .from("plans")
    .select("id", { head: true, count: "exact" });
  if (adminError) {
    fail(`Admin connectivity failed: ${adminError.message}`);
  }
  console.log("✓ Service role can access database.");

  const anonClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  try {
    const { status } = await anonClient.from("plans").select("id").limit(1);
    if (status >= 500 || status === 0) {
      fail(`Anon connectivity failed with status ${status}.`);
    }
  } catch (error) {
    fail(
      `Anon connectivity failed: ${
        error instanceof Error ? error.message : "unknown error"
      }`,
    );
  }
  console.log("✓ Anon key reaches Supabase API.");
  console.log("Supabase connection check passed.");
}

void main();
