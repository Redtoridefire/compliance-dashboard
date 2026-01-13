# CyberComply Setup Guide

This guide covers setting up CyberComply for production use with Supabase and OpenAI.

## Demo Mode vs Production Mode

CyberComply works in two modes:

1. **Demo Mode** (Default): Works out of the box with no configuration. Uses seed data and in-memory storage. Perfect for testing and evaluation.

2. **Production Mode**: Requires Supabase database and optionally OpenAI API key for AI features. Provides persistent storage and full functionality.

---

## Quick Start (Demo Mode)

No setup required! Just run:

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` and complete the onboarding flow to explore all features.

---

## Production Setup

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `cybercomply` (or your preferred name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be provisioned (1-2 minutes)

### Step 2: Get Your API Keys

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJhbGc...` (long JWT token)

### Step 3: Set Up the Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the following SQL, then click "Run":

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100) NOT NULL,
  sub_industry VARCHAR(100),
  company_size VARCHAR(50),
  geography TEXT[], -- Array of regions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'viewer', -- admin, editor, viewer
  session_token VARCHAR(255),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Frameworks table
CREATE TABLE frameworks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  abbreviation VARCHAR(50) NOT NULL,
  version VARCHAR(50),
  description TEXT,
  category VARCHAR(100), -- Regulatory, Industry Standard, Best Practice
  applicable_industries TEXT[], -- Array of industries
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Controls table
CREATE TABLE controls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  framework_id UUID REFERENCES frameworks(id) ON DELETE CASCADE,
  control_id VARCHAR(100) NOT NULL, -- e.g., "AC-1", "CC1.1"
  title VARCHAR(500) NOT NULL,
  description TEXT,
  control_family VARCHAR(100),
  priority VARCHAR(50), -- Critical, High, Medium, Low
  implementation_guidance TEXT,
  testing_procedures TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(framework_id, control_id)
);

-- Control mappings (cross-framework)
CREATE TABLE control_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_control_id UUID REFERENCES controls(id) ON DELETE CASCADE,
  target_control_id UUID REFERENCES controls(id) ON DELETE CASCADE,
  mapping_type VARCHAR(50) NOT NULL, -- Equivalent, Partial, Related
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source_control_id, target_control_id)
);

-- Organization frameworks (selected frameworks per org)
CREATE TABLE organization_frameworks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  framework_id UUID REFERENCES frameworks(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  target_compliance_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, framework_id)
);

-- Control implementations (per org)
CREATE TABLE control_implementations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  control_id UUID REFERENCES controls(id) ON DELETE CASCADE,
  implementation_status VARCHAR(50) DEFAULT 'Not Started',
  implementation_notes TEXT,
  evidence_urls TEXT[],
  assigned_to UUID REFERENCES users(id),
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  last_reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, control_id)
);

-- Gap analysis results
CREATE TABLE gap_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  control_id UUID REFERENCES controls(id) ON DELETE CASCADE,
  satisfies_frameworks UUID[], -- Framework IDs where this control is satisfied
  gap_frameworks UUID[], -- Framework IDs where there's a gap
  gap_severity VARCHAR(50), -- Critical, High, Medium, Low
  estimated_effort VARCHAR(50), -- Low, Medium, High
  ai_recommendation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI interaction logs
CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL, -- gap_analysis, recommendation, chat
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_session ON users(session_token);
CREATE INDEX idx_controls_framework ON controls(framework_id);
CREATE INDEX idx_controls_family ON controls(control_family);
CREATE INDEX idx_implementations_org ON control_implementations(organization_id);
CREATE INDEX idx_implementations_control ON control_implementations(control_id);
CREATE INDEX idx_gap_analysis_org ON gap_analysis(organization_id);
CREATE INDEX idx_gap_analysis_severity ON gap_analysis(gap_severity);
CREATE INDEX idx_org_frameworks_org ON organization_frameworks(organization_id);
CREATE INDEX idx_ai_interactions_org ON ai_interactions(organization_id);

-- Enable Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_implementations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gap_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for now - customize based on auth strategy)
CREATE POLICY "Allow all operations" ON organizations FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON control_implementations FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON gap_analysis FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON organization_frameworks FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON ai_interactions FOR ALL USING (true);
```

### Step 4: Seed the Database with Framework Data

Run this SQL to populate frameworks and controls:

```sql
-- Insert frameworks
INSERT INTO frameworks (name, abbreviation, version, description, category, applicable_industries, is_active) VALUES
('NIST Cybersecurity Framework', 'NIST CSF', '2.0', 'Comprehensive cybersecurity framework providing guidelines for managing and reducing cybersecurity risk', 'Industry Standard', ARRAY['All'], true),
('SOC 2 Type II', 'SOC 2', '2017', 'Service Organization Control framework for managing customer data based on trust service criteria', 'Industry Standard', ARRAY['Technology', 'Finance', 'Healthcare'], true),
('ISO 27001', 'ISO 27001', '2022', 'International standard for information security management systems (ISMS)', 'International Standard', ARRAY['All'], true),
('HIPAA', 'HIPAA', '2013', 'Health Insurance Portability and Accountability Act - US healthcare data protection requirements', 'Regulatory', ARRAY['Healthcare'], true),
('PCI DSS', 'PCI DSS', '4.0', 'Payment Card Industry Data Security Standard for organizations handling credit card data', 'Regulatory', ARRAY['Finance', 'Retail', 'E-commerce'], true),
('CIS Controls', 'CIS', 'v8', 'Prioritized set of actions to protect organizations from known cyber attack vectors', 'Best Practice', ARRAY['All'], true);

-- Get framework IDs for control insertion
-- You can then insert controls specific to each framework
-- The seed-data/controls.json file contains sample controls
```

### Step 5: Configure Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI Configuration (optional - for AI features)
OPENAI_API_KEY=sk-your-openai-api-key

# Environment
NODE_ENV=production
```

### Step 6: Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and create a new project
3. Import your GitHub repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY` (optional)
5. Deploy!

---

## OpenAI Setup (Optional)

For AI-powered features like gap recommendations and compliance chat:

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Navigate to **API Keys**
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)
6. Add to your environment variables as `OPENAI_API_KEY`

**Note**: Without OpenAI configured, the app will use pre-configured demo responses for AI features.

---

## Feature Availability by Mode

| Feature | Demo Mode | Production Mode |
|---------|-----------|-----------------|
| Framework Selection | Seed Data | Database |
| Control Browsing | Seed Data | Database |
| Gap Analysis | Generated | Computed |
| Control Implementation Tracking | In-Memory | Persistent |
| User Registration | In-Memory | Persistent |
| Multi-Organization | Session Only | Full Support |
| AI Recommendations | Demo Responses | OpenAI Powered |
| AI Chat Assistant | Demo Responses | OpenAI Powered |
| Data Export | Full | Full |

---

## Security Considerations

For production deployments:

1. **Enable Supabase Auth**: Consider using Supabase Auth instead of session tokens for better security
2. **Configure RLS Policies**: Update Row Level Security policies to restrict access based on organization
3. **Use Environment Variables**: Never commit API keys to source control
4. **Enable HTTPS**: Ensure your deployment uses HTTPS
5. **Regular Backups**: Configure automatic database backups in Supabase

---

## Troubleshooting

### "Supabase not configured" warnings
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Check that environment variables are loaded (restart your dev server)

### "OpenAI API key not set"
- AI features will fall back to demo mode
- This is not an error - the app works without OpenAI

### Database connection errors
- Verify your Supabase project is active (not paused)
- Check that the anon key is correct
- Ensure the database schema has been created

### Frameworks/Controls not showing
- In demo mode, seed data is used automatically
- In production mode, run the SQL seed scripts to populate data

---

## Support

For issues and questions:
- GitHub Issues: [github.com/your-repo/issues](https://github.com/your-repo/issues)
- Documentation: See ARCHITECTURE.md for system design details
