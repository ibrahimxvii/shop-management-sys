import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import type { Database } from "@/types/database";

/**
 * Supabase PKCE auth callback handler.
 *
 * Supabase sends all email-based flows (email confirmation, password reset,
 * magic link) to this route with a `code` query parameter. We exchange that
 * one-time code for a session here, then redirect the user to their intended
 * destination (`next` param, defaults to /dashboard).
 *
 * Configured in Supabase Dashboard → Auth → URL Configuration:
 *   Site URL: http://localhost:3000 (dev) / https://your-domain.com (prod)
 *   Redirect URLs: http://localhost:3000/auth/callback
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Missing authentication code.")}`
    );
  }

  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    logger.error("[auth/callback] Code exchange failed:", error.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  // Ensure `next` stays on the same origin (CSRF protection).
  const safeNext = next.startsWith("/") ? next : "/dashboard";
  return NextResponse.redirect(`${origin}${safeNext}`);
}
