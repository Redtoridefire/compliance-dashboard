// Organization Types
export interface Organization {
  id: string;
  name: string;
  industry: string;
  sub_industry?: string;
  company_size?: string;
  geography: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateOrganizationInput {
  name: string;
  industry: string;
  sub_industry?: string;
  company_size?: string;
  geography: string[];
}

// User Types
export interface User {
  id: string;
  email: string;
  name?: string;
  organization_id?: string;
  role: "admin" | "user" | "viewer";
  session_token?: string;
  last_login?: string;
  created_at: string;
}

export interface CreateUserInput {
  email: string;
  name?: string;
  organization_id: string;
  role?: "admin" | "user" | "viewer";
}

// Session Types
export interface Session {
  userId: string;
  organizationId: string;
  email: string;
  name: string;
  role: string;
  sessionToken: string;
}

// Framework Types
export interface Framework {
  id: string;
  name: string;
  abbreviation: string;
  category: string;
  description?: string;
  version?: string;
  applicable_industries: string[];
  documentation_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface FrameworkWithStats extends Framework {
  total_controls: number;
  implemented_controls: number;
  compliance_percentage: number;
}

// Control Types
export interface Control {
  id: string;
  framework_id: string;
  control_id: string;
  title: string;
  description?: string;
  control_family: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  implementation_guidance?: string;
  created_at: string;
}

export interface ControlWithFramework extends Control {
  framework: Framework;
}

export interface ControlWithImplementation extends Control {
  implementation?: ControlImplementation;
  framework: Framework;
}

// Control Mapping Types
export interface ControlMapping {
  id: string;
  source_control_id: string;
  target_control_id: string;
  mapping_type: "Equivalent" | "Partial" | "Related" | "Superset" | "Subset";
  confidence_score: number;
  mapping_notes?: string;
  created_at: string;
}

export interface ControlMappingWithControls extends ControlMapping {
  source_control: ControlWithFramework;
  target_control: ControlWithFramework;
}

// Organization Framework Types
export interface OrganizationFramework {
  id: string;
  organization_id: string;
  framework_id: string;
  compliance_status: "Not Started" | "In Progress" | "Compliant" | "Under Review";
  target_compliance_date?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationFrameworkWithDetails extends OrganizationFramework {
  framework: Framework;
  assigned_user?: User;
}

// Control Implementation Types
export interface ControlImplementation {
  id: string;
  organization_id: string;
  control_id: string;
  implementation_status: "Not Implemented" | "Partially Implemented" | "Fully Implemented";
  implementation_notes?: string;
  evidence_urls: string[];
  assigned_to?: string;
  last_reviewed_at?: string;
  last_reviewed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ControlImplementationWithDetails extends ControlImplementation {
  control: ControlWithFramework;
  assigned_user?: User;
  reviewer?: User;
}

// Gap Analysis Types
export interface GapAnalysis {
  id: string;
  organization_id: string;
  control_id: string;
  satisfies_frameworks: string[];
  gap_frameworks: string[];
  gap_severity: "Critical" | "High" | "Medium" | "Low";
  ai_recommendation?: string;
  estimated_effort: "Low" | "Medium" | "High";
  created_at: string;
  updated_at: string;
}

export interface GapAnalysisWithDetails extends GapAnalysis {
  control: ControlWithFramework;
  satisfied_framework_details: Framework[];
  gap_framework_details: Framework[];
}

// AI Interaction Types
export interface AIInteraction {
  id: string;
  organization_id: string;
  user_id?: string;
  interaction_type: "gap_analysis" | "recommendation" | "chat" | "control_suggestion";
  prompt: string;
  response: string;
  context?: Record<string, unknown>;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Dashboard Types
export interface DashboardStats {
  totalFrameworks: number;
  selectedFrameworks: number;
  totalControls: number;
  implementedControls: number;
  partiallyImplementedControls: number;
  notImplementedControls: number;
  totalGaps: number;
  criticalGaps: number;
  highGaps: number;
  overallCompliancePercentage: number;
}

export interface FrameworkComplianceScore {
  frameworkId: string;
  frameworkName: string;
  frameworkAbbreviation: string;
  totalControls: number;
  implementedControls: number;
  partiallyImplementedControls: number;
  compliancePercentage: number;
  status: string;
}

// Filter Types
export interface ControlFilters {
  frameworkId?: string;
  controlFamily?: string;
  priority?: string;
  implementationStatus?: string;
  searchQuery?: string;
}

export interface GapFilters {
  severity?: string;
  frameworkId?: string;
  searchQuery?: string;
}

// Form Types
export interface OnboardingFormData {
  organizationName: string;
  industry: string;
  subIndustry?: string;
  companySize: string;
  geography: string[];
  userName: string;
  userEmail: string;
  selectedFrameworks: string[];
}

// Seed Data Types
export interface SeedFramework {
  name: string;
  abbreviation: string;
  category: string;
  description: string;
  version: string;
  applicable_industries: string[];
  documentation_url: string;
}

export interface SeedControl {
  framework_abbreviation: string;
  control_id: string;
  title: string;
  description: string;
  control_family: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  implementation_guidance: string;
}

export interface SeedControlMapping {
  source_framework: string;
  source_control_id: string;
  target_framework: string;
  target_control_id: string;
  mapping_type: "Equivalent" | "Partial" | "Related" | "Superset" | "Subset";
  confidence_score: number;
  mapping_notes?: string;
}
