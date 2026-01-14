import { NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  const timestamp = new Date().toISOString();

  // Check environment variables at RUNTIME
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const envStatus = {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : "(not set)",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : "(not set)",
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey ? "(set)" : "(not set)",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "(set)" : "(not set)",
    NODE_ENV: process.env.NODE_ENV || "(not set)",
  };

  // Check if Supabase is configured (runtime check)
  const supabaseConfigured = isSupabaseConfigured();

  let databaseStatus = {
    connected: false,
    error: null as string | null,
    tables: null as Record<string, number> | null,
  };

  // Test database connection if configured
  if (supabaseConfigured) {
    try {
      const supabase = createServerClient();

      // Test connection by querying tables
      const [usersResult, frameworksResult, controlsResult, orgsResult] = await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: true }),
        supabase.from("frameworks").select("id", { count: "exact", head: true }),
        supabase.from("controls").select("id", { count: "exact", head: true }),
        supabase.from("organizations").select("id", { count: "exact", head: true }),
      ]);

      // Check for errors
      const errors = [usersResult.error, frameworksResult.error, controlsResult.error, orgsResult.error]
        .filter(Boolean)
        .map((e) => e?.message);

      if (errors.length > 0) {
        databaseStatus = {
          connected: false,
          error: errors.join("; "),
          tables: null,
        };
      } else {
        databaseStatus = {
          connected: true,
          error: null,
          tables: {
            users: usersResult.count || 0,
            frameworks: frameworksResult.count || 0,
            controls: controlsResult.count || 0,
            organizations: orgsResult.count || 0,
          },
        };
      }
    } catch (error) {
      databaseStatus = {
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error",
        tables: null,
      };
    }
  }

  // Determine overall health status
  let status: "healthy" | "degraded" | "demo_mode" = "demo_mode";
  if (supabaseConfigured) {
    status = databaseStatus.connected ? "healthy" : "degraded";
  }

  const response = {
    status,
    timestamp,
    supabase: {
      configured: supabaseConfigured,
      ...databaseStatus,
    },
    environment: envStatus,
    mode: supabaseConfigured ? "production" : "demo",
    message: supabaseConfigured
      ? databaseStatus.connected
        ? "Supabase is configured and connected"
        : `Supabase is configured but connection failed: ${databaseStatus.error}`
      : "Running in demo mode - Supabase environment variables not detected at runtime",
  };

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
