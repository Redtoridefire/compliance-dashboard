import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client with service role (for API routes)
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceRoleKey, {
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
