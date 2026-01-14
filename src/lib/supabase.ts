import { createClient, SupabaseClient } from "@supabase/supabase-js";

// IMPORTANT: These functions check configuration at RUNTIME, not build time
// This fixes the issue where env vars may not be available during the build

function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
}

// Check if Supabase is configured - MUST be a function for runtime evaluation
export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  const configured = Boolean(url && key && url.length > 0 && key.length > 0);

  // Debug logging for troubleshooting (only log on server)
  if (typeof window === "undefined") {
    console.log("[Supabase Config]", {
      configured,
      hasUrl: Boolean(url && url.length > 0),
      hasKey: Boolean(key && key.length > 0),
      urlPrefix: url ? url.substring(0, 30) + "..." : "(not set)",
    });
  }

  return configured;
}

// Create a mock client for when Supabase is not configured
function createMockClient(): SupabaseClient {
  const mockResponse = { data: null, error: null, count: null };
  const mockQueryBuilder = {
    select: () => mockQueryBuilder,
    insert: () => mockQueryBuilder,
    update: () => mockQueryBuilder,
    delete: () => mockQueryBuilder,
    eq: () => mockQueryBuilder,
    neq: () => mockQueryBuilder,
    ilike: () => mockQueryBuilder,
    in: () => mockQueryBuilder,
    or: () => mockQueryBuilder,
    order: () => mockQueryBuilder,
    limit: () => mockQueryBuilder,
    single: () => Promise.resolve(mockResponse),
    then: (resolve: (value: typeof mockResponse) => void) => Promise.resolve(mockResponse).then(resolve),
  };

  return {
    from: () => mockQueryBuilder,
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
  } as unknown as SupabaseClient;
}

// Singleton for client-side Supabase client
let clientInstance: SupabaseClient | null = null;

// Get client-side Supabase client (uses anon key) - created lazily at runtime
export function getSupabaseClient(): SupabaseClient {
  if (clientInstance) {
    return clientInstance;
  }

  if (!isSupabaseConfigured()) {
    console.warn("[Supabase] Not configured - using mock client");
    clientInstance = createMockClient();
    return clientInstance;
  }

  clientInstance = createClient(getSupabaseUrl(), getSupabaseAnonKey());
  return clientInstance;
}

// For backwards compatibility - lazily initialized
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = client[prop as keyof SupabaseClient];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

// Server-side Supabase client with service role (for API routes)
// Creates a new client on each call to ensure fresh runtime config
export function createServerClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    console.warn("[Supabase Server] Not configured - using mock client");
    return createMockClient();
  }

  const url = getSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || getSupabaseAnonKey();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Database types based on our schema
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          industry: string;
          sub_industry: string | null;
          company_size: string | null;
          geography: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          industry: string;
          sub_industry?: string | null;
          company_size?: string | null;
          geography?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          industry?: string;
          sub_industry?: string | null;
          company_size?: string | null;
          geography?: string[];
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          organization_id: string | null;
          role: string;
          session_token: string | null;
          last_login: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          organization_id?: string | null;
          role?: string;
          session_token?: string | null;
          last_login?: string | null;
          created_at?: string;
        };
        Update: {
          email?: string;
          name?: string | null;
          organization_id?: string | null;
          role?: string;
          session_token?: string | null;
          last_login?: string | null;
        };
      };
      frameworks: {
        Row: {
          id: string;
          name: string;
          abbreviation: string;
          category: string;
          description: string | null;
          version: string | null;
          applicable_industries: string[];
          documentation_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          abbreviation: string;
          category: string;
          description?: string | null;
          version?: string | null;
          applicable_industries?: string[];
          documentation_url?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          abbreviation?: string;
          category?: string;
          description?: string | null;
          version?: string | null;
          applicable_industries?: string[];
          documentation_url?: string | null;
          is_active?: boolean;
        };
      };
      controls: {
        Row: {
          id: string;
          framework_id: string;
          control_id: string;
          title: string;
          description: string | null;
          control_family: string;
          priority: string;
          implementation_guidance: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          framework_id: string;
          control_id: string;
          title: string;
          description?: string | null;
          control_family: string;
          priority: string;
          implementation_guidance?: string | null;
          created_at?: string;
        };
        Update: {
          framework_id?: string;
          control_id?: string;
          title?: string;
          description?: string | null;
          control_family?: string;
          priority?: string;
          implementation_guidance?: string | null;
        };
      };
      control_mappings: {
        Row: {
          id: string;
          source_control_id: string;
          target_control_id: string;
          mapping_type: string;
          confidence_score: number;
          mapping_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_control_id: string;
          target_control_id: string;
          mapping_type: string;
          confidence_score: number;
          mapping_notes?: string | null;
          created_at?: string;
        };
        Update: {
          source_control_id?: string;
          target_control_id?: string;
          mapping_type?: string;
          confidence_score?: number;
          mapping_notes?: string | null;
        };
      };
      organization_frameworks: {
        Row: {
          id: string;
          organization_id: string;
          framework_id: string;
          compliance_status: string;
          target_compliance_date: string | null;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          framework_id: string;
          compliance_status?: string;
          target_compliance_date?: string | null;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          framework_id?: string;
          compliance_status?: string;
          target_compliance_date?: string | null;
          assigned_to?: string | null;
          updated_at?: string;
        };
      };
      control_implementations: {
        Row: {
          id: string;
          organization_id: string;
          control_id: string;
          implementation_status: string;
          implementation_notes: string | null;
          evidence_urls: string[];
          assigned_to: string | null;
          last_reviewed_at: string | null;
          last_reviewed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          control_id: string;
          implementation_status?: string;
          implementation_notes?: string | null;
          evidence_urls?: string[];
          assigned_to?: string | null;
          last_reviewed_at?: string | null;
          last_reviewed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          control_id?: string;
          implementation_status?: string;
          implementation_notes?: string | null;
          evidence_urls?: string[];
          assigned_to?: string | null;
          last_reviewed_at?: string | null;
          last_reviewed_by?: string | null;
          updated_at?: string;
        };
      };
      gap_analysis: {
        Row: {
          id: string;
          organization_id: string;
          control_id: string;
          satisfies_frameworks: string[];
          gap_frameworks: string[];
          gap_severity: string;
          ai_recommendation: string | null;
          estimated_effort: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          control_id: string;
          satisfies_frameworks?: string[];
          gap_frameworks?: string[];
          gap_severity: string;
          ai_recommendation?: string | null;
          estimated_effort: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          control_id?: string;
          satisfies_frameworks?: string[];
          gap_frameworks?: string[];
          gap_severity?: string;
          ai_recommendation?: string | null;
          estimated_effort?: string;
          updated_at?: string;
        };
      };
      ai_interactions: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          interaction_type: string;
          prompt: string;
          response: string;
          context: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id?: string | null;
          interaction_type: string;
          prompt: string;
          response: string;
          context?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          organization_id?: string;
          user_id?: string | null;
          interaction_type?: string;
          prompt?: string;
          response?: string;
          context?: Record<string, unknown> | null;
        };
      };
    };
  };
}
