/**
 * Validated environment variables.
 * Import `env` instead of `process.env` for type-safe access.
 * Throws at startup if a required variable is missing.
 */

function getRequired(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[env] Missing required environment variable: ${key}\n` +
        `Ensure it is set in .env.local and matches .env.example.`
    );
  }
  return value;
}

function getOptional(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: getRequired("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: getRequired("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: getOptional("SUPABASE_SERVICE_ROLE_KEY"),
  NEXT_PUBLIC_APP_URL: getOptional(
    "NEXT_PUBLIC_APP_URL",
    "http://localhost:3000"
  ),
  NEXT_PUBLIC_APP_NAME: getOptional("NEXT_PUBLIC_APP_NAME", "ShopFlow"),
  NODE_ENV: getOptional("NODE_ENV", "development") as
    | "development"
    | "production"
    | "test",
} as const;
