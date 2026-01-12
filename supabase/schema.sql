-- CyberComply Framework Mapper - Database Schema
-- Run this script in your Supabase SQL editor to create all tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations Table (Multi-tenant core)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  sub_industry TEXT,
  company_size TEXT, -- '1-50', '51-200', '201-1000', '1000+'
  geography TEXT[], -- Array of countries/regions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users Table (Simple auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'user', -- 'admin', 'user', 'viewer'
  session_token TEXT UNIQUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Frameworks Table
CREATE TABLE IF NOT EXISTS frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- 'Financial Services', 'General', 'AI Governance', 'Privacy'
  description TEXT,
  version TEXT,
  applicable_industries TEXT[], -- Filter frameworks by industry
  documentation_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Controls Table
CREATE TABLE IF NOT EXISTS controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID REFERENCES frameworks(id) ON DELETE CASCADE,
  control_id TEXT NOT NULL, -- e.g., 'IA-2(1)', 'A.9.4.2', '500.12'
  title TEXT NOT NULL,
  description TEXT,
  control_family TEXT, -- 'Access Control', 'Encryption', 'Incident Response'
  priority TEXT, -- 'Critical', 'High', 'Medium', 'Low'
  implementation_guidance TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(framework_id, control_id)
);

-- Control Mappings Table (Cross-framework equivalencies)
CREATE TABLE IF NOT EXISTS control_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_control_id UUID REFERENCES controls(id) ON DELETE CASCADE,
  target_control_id UUID REFERENCES controls(id) ON DELETE CASCADE,
  mapping_type TEXT, -- 'Equivalent', 'Partial', 'Related', 'Superset', 'Subset'
  confidence_score NUMERIC(3,2), -- 0.00 to 1.00
  mapping_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_control_id, target_control_id)
);

-- Organization Frameworks (Which frameworks each org needs)
CREATE TABLE IF NOT EXISTS organization_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  framework_id UUID REFERENCES frameworks(id) ON DELETE CASCADE,
  compliance_status TEXT DEFAULT 'Not Started', -- 'Not Started', 'In Progress', 'Compliant', 'Under Review'
  target_compliance_date DATE,
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, framework_id)
);

-- Control Implementations (Org's actual control inventory)
CREATE TABLE IF NOT EXISTS control_implementations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  control_id UUID REFERENCES controls(id) ON DELETE CASCADE,
  implementation_status TEXT DEFAULT 'Not Implemented', -- 'Not Implemented', 'Partially Implemented', 'Fully Implemented'
  implementation_notes TEXT,
  evidence_urls TEXT[], -- Array of documentation/evidence links
  assigned_to UUID REFERENCES users(id),
  last_reviewed_at TIMESTAMPTZ,
  last_reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, control_id)
);

-- Gap Analysis Cache (Computed results)
CREATE TABLE IF NOT EXISTS gap_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  control_id UUID REFERENCES controls(id) ON DELETE CASCADE,
  satisfies_frameworks UUID[], -- Array of framework IDs this control satisfies
  gap_frameworks UUID[], -- Array of framework IDs with gaps
  gap_severity TEXT, -- 'Critical', 'High', 'Medium', 'Low'
  ai_recommendation TEXT, -- AI-generated remediation advice
  estimated_effort TEXT, -- 'Low', 'Medium', 'High'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, control_id)
);

-- AI Interaction Log (Track AI recommendations)
CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  interaction_type TEXT, -- 'gap_analysis', 'recommendation', 'chat', 'control_suggestion'
  prompt TEXT,
  response TEXT,
  context JSONB, -- Store relevant context data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_controls_framework ON controls(framework_id);
CREATE INDEX IF NOT EXISTS idx_controls_family ON controls(control_family);
CREATE INDEX IF NOT EXISTS idx_control_mappings_source ON control_mappings(source_control_id);
CREATE INDEX IF NOT EXISTS idx_control_mappings_target ON control_mappings(target_control_id);
CREATE INDEX IF NOT EXISTS idx_org_frameworks_org ON organization_frameworks(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_frameworks_framework ON organization_frameworks(framework_id);
CREATE INDEX IF NOT EXISTS idx_control_impl_org ON control_implementations(organization_id);
CREATE INDEX IF NOT EXISTS idx_control_impl_control ON control_implementations(control_id);
CREATE INDEX IF NOT EXISTS idx_control_impl_status ON control_implementations(implementation_status);
CREATE INDEX IF NOT EXISTS idx_gap_analysis_org ON gap_analysis(organization_id);
CREATE INDEX IF NOT EXISTS idx_gap_analysis_severity ON gap_analysis(gap_severity);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_session ON users(session_token);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_org ON ai_interactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_type ON ai_interactions(interaction_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_org_frameworks_updated_at ON organization_frameworks;
CREATE TRIGGER update_org_frameworks_updated_at
    BEFORE UPDATE ON organization_frameworks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_control_impl_updated_at ON control_implementations;
CREATE TRIGGER update_control_impl_updated_at
    BEFORE UPDATE ON control_implementations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gap_analysis_updated_at ON gap_analysis;
CREATE TRIGGER update_gap_analysis_updated_at
    BEFORE UPDATE ON gap_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Note: These are disabled by default for MVP. Enable for production.

-- Enable RLS on tables
-- ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE organization_frameworks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE control_implementations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE gap_analysis ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (uncomment for production)
-- CREATE POLICY "Users can view their own organization" ON organizations
--     FOR SELECT USING (id IN (
--         SELECT organization_id FROM users WHERE session_token = current_setting('app.session_token', true)
--     ));

-- CREATE POLICY "Users can view controls for their frameworks" ON control_implementations
--     FOR SELECT USING (organization_id IN (
--         SELECT organization_id FROM users WHERE session_token = current_setting('app.session_token', true)
--     ));
