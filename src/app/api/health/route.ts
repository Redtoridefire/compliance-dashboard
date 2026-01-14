import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { isOpenAIConfigured } from "@/lib/openai";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    config: {
      supabase: isSupabaseConfigured,
      openai: isOpenAIConfigured(),
      // Show if env vars exist (not their values for security)
      env: {
        NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        OPENAI_API_KEY: Boolean(process.env.OPENAI_API_KEY),
      }
    },
    mode: isSupabaseConfigured ? "production" : "demo"
  });
}
