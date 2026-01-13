import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import {
  generateGapRecommendation,
  suggestFrameworks,
  generateChatResponse,
  checkRateLimit,
  getRateLimitRemaining,
  isOpenAIConfigured,
} from "@/lib/openai";
import frameworksData from "../../../../seed-data/frameworks.json";
import controlsData from "../../../../seed-data/controls.json";

// Demo recommendations based on control family
const demoRecommendations: Record<string, string> = {
  "Access Control": `**Recommendation for Access Control Implementation**

1. **Immediate Actions:**
   - Implement role-based access control (RBAC) for all critical systems
   - Enable multi-factor authentication (MFA) for privileged accounts
   - Review and remove unnecessary access permissions

2. **Short-term Goals:**
   - Deploy identity and access management (IAM) solution
   - Implement privileged access management (PAM)
   - Create access review schedules

3. **Long-term Strategy:**
   - Implement zero-trust architecture principles
   - Deploy continuous access verification
   - Automate access provisioning/deprovisioning`,

  "Risk Assessment": `**Recommendation for Risk Assessment Implementation**

1. **Immediate Actions:**
   - Establish risk assessment methodology
   - Identify and document critical assets
   - Conduct initial threat assessment

2. **Short-term Goals:**
   - Implement continuous risk monitoring
   - Create risk register and treatment plans
   - Train staff on risk identification

3. **Long-term Strategy:**
   - Integrate risk assessment into business processes
   - Deploy automated risk scoring tools
   - Establish risk appetite framework`,

  default: `**General Compliance Recommendation**

1. **Immediate Actions:**
   - Document current control implementation status
   - Identify gaps and prioritize remediation
   - Assign control ownership

2. **Short-term Goals:**
   - Develop implementation roadmap
   - Allocate resources for remediation
   - Establish monitoring procedures

3. **Long-term Strategy:**
   - Integrate into continuous compliance program
   - Automate evidence collection
   - Regular review and improvement cycles`,
};

// Demo framework suggestions based on industry
const demoFrameworkSuggestions: Record<string, string> = {
  Healthcare: `Based on your Healthcare industry profile, I recommend:

1. **HIPAA** (Required) - Essential for protecting patient health information
2. **NIST CSF** (Recommended) - Provides comprehensive cybersecurity framework
3. **SOC 2** (Recommended) - Demonstrates security practices to partners

Start with HIPAA compliance as it's a regulatory requirement, then layer NIST CSF for broader security coverage.`,

  Finance: `Based on your Finance industry profile, I recommend:

1. **SOC 2** (Required) - Standard for financial service providers
2. **PCI DSS** (If applicable) - Required if processing payment cards
3. **NIST CSF** (Recommended) - Comprehensive cybersecurity framework

Focus on SOC 2 Type II certification first, as it's most commonly requested by clients and partners.`,

  Technology: `Based on your Technology industry profile, I recommend:

1. **SOC 2** (Highly Recommended) - Industry standard for tech companies
2. **ISO 27001** (Recommended) - International security standard
3. **NIST CSF** (Recommended) - Comprehensive security framework

SOC 2 is often required by enterprise customers and should be your first priority.`,

  default: `Based on your organization profile, I recommend:

1. **NIST CSF** (Recommended) - Flexible, comprehensive framework suitable for any industry
2. **SOC 2** (Recommended) - Demonstrates security practices to partners and customers
3. **CIS Controls** (Recommended) - Practical security controls for any organization

Start with NIST CSF as it provides a solid foundation that maps well to other frameworks.`,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, organizationId, ...data } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    // Check rate limit
    if (!checkRateLimit(organizationId)) {
      const remaining = getRateLimitRemaining(organizationId);
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please try again in a minute.",
          rateLimitRemaining: remaining,
        },
        { status: 429 }
      );
    }

    // If OpenAI is not configured, use demo responses
    if (!isOpenAIConfigured()) {
      return handleDemoMode(action, organizationId, data);
    }

    const supabase = createServerClient();

    switch (action) {
      case "gap_recommendation": {
        const { controlId } = data;

        // Fetch control details - use seed data in demo mode
        let control;
        if (isSupabaseConfigured) {
          const { data: dbControl, error: controlError } = await supabase
            .from("controls")
            .select("*, framework:frameworks(*)")
            .eq("id", controlId)
            .single();

          if (controlError || !dbControl) {
            // Fall back to seed data
            control = getControlFromSeedData(controlId);
          } else {
            control = dbControl;
          }
        } else {
          control = getControlFromSeedData(controlId);
        }

        if (!control) {
          return NextResponse.json(
            { error: "Control not found" },
            { status: 404 }
          );
        }

        // Fetch implementation
        let implementation = null;
        if (isSupabaseConfigured) {
          const { data: impl } = await supabase
            .from("control_implementations")
            .select("*")
            .eq("organization_id", organizationId)
            .eq("control_id", controlId)
            .single();
          implementation = impl;
        }

        // Find mapped controls in other frameworks
        let mappings = null;
        if (isSupabaseConfigured) {
          const { data: mapData } = await supabase
            .from("control_mappings")
            .select(
              `
              *,
              target_control:controls!control_mappings_target_control_id_fkey(*, framework:frameworks(*))
            `
            )
            .eq("source_control_id", controlId);
          mappings = mapData;
        }

        const frameworks = [
          { framework: control.framework, controlId: control.control_id },
          ...(mappings?.map((m) => ({
            framework: (m.target_control as any).framework,
            controlId: (m.target_control as any).control_id,
          })) || []),
        ];

        // Generate recommendation
        const recommendation = await generateGapRecommendation({
          control,
          implementation,
          frameworks,
        });

        // Log the interaction if Supabase is configured
        if (isSupabaseConfigured) {
          await supabase.from("ai_interactions").insert({
            organization_id: organizationId,
            interaction_type: "gap_analysis",
            prompt: `Gap analysis for control: ${control.control_id}`,
            response: recommendation,
            context: { controlId, implementationStatus: implementation?.implementation_status },
          });

          // Optionally update gap_analysis with recommendation
          await supabase
            .from("gap_analysis")
            .update({ ai_recommendation: recommendation })
            .eq("organization_id", organizationId)
            .eq("control_id", controlId);
        }

        return NextResponse.json({
          recommendation,
          rateLimitRemaining: getRateLimitRemaining(organizationId),
        });
      }

      case "framework_suggestions": {
        // Fetch organization details
        let organization = null;
        if (isSupabaseConfigured) {
          const { data: org, error: orgError } = await supabase
            .from("organizations")
            .select("*")
            .eq("id", organizationId)
            .single();

          if (!orgError && org) {
            organization = org;
          }
        }

        // Fall back to demo organization
        if (!organization) {
          organization = {
            id: organizationId,
            name: "Demo Organization",
            industry: "Technology",
          };
        }

        // Fetch available frameworks
        let frameworks;
        if (isSupabaseConfigured) {
          const { data: fwData } = await supabase
            .from("frameworks")
            .select("*")
            .eq("is_active", true);
          frameworks = fwData;
        }

        if (!frameworks || frameworks.length === 0) {
          frameworks = frameworksData.map((f, index) => ({
            id: `framework-${index + 1}`,
            name: f.name,
            abbreviation: f.abbreviation,
            version: f.version,
            description: f.description,
            is_active: true,
          }));
        }

        const suggestions = await suggestFrameworks({
          organization,
          availableFrameworks: frameworks,
        });

        // Log the interaction if Supabase is configured
        if (isSupabaseConfigured) {
          await supabase.from("ai_interactions").insert({
            organization_id: organizationId,
            interaction_type: "recommendation",
            prompt: "Framework selection assistance",
            response: suggestions,
            context: { industry: organization.industry },
          });
        }

        return NextResponse.json({
          suggestions,
          rateLimitRemaining: getRateLimitRemaining(organizationId),
        });
      }

      case "chat": {
        const { messages } = data;

        // Fetch organization details
        let organization = null;
        if (isSupabaseConfigured) {
          const { data: org, error: orgError } = await supabase
            .from("organizations")
            .select("*")
            .eq("id", organizationId)
            .single();

          if (!orgError && org) {
            organization = org;
          }
        }

        if (!organization) {
          organization = {
            id: organizationId,
            name: "Demo Organization",
            industry: "Technology",
          };
        }

        // Fetch selected frameworks
        let selectedFrameworks: any[] = [];
        if (isSupabaseConfigured) {
          const { data: orgFrameworks } = await supabase
            .from("organization_frameworks")
            .select("*, framework:frameworks(*)")
            .eq("organization_id", organizationId);

          selectedFrameworks = orgFrameworks?.map((of) => of.framework as any) || [];
        }

        // Calculate compliance score
        let complianceScore = 0;
        if (isSupabaseConfigured) {
          const { data: implementations } = await supabase
            .from("control_implementations")
            .select("implementation_status")
            .eq("organization_id", organizationId);

          const implemented =
            implementations?.filter(
              (i) => i.implementation_status === "Fully Implemented"
            ).length || 0;
          const total = implementations?.length || 1;
          complianceScore = Math.round((implemented / total) * 100);
        }

        // Generate response
        const response = await generateChatResponse(messages, {
          organization,
          selectedFrameworks,
          complianceScore,
        });

        // Log the interaction if Supabase is configured
        if (isSupabaseConfigured) {
          const userMessage = messages[messages.length - 1]?.content || "";
          await supabase.from("ai_interactions").insert({
            organization_id: organizationId,
            interaction_type: "chat",
            prompt: userMessage,
            response,
            context: { messageCount: messages.length },
          });
        }

        return NextResponse.json({
          response,
          rateLimitRemaining: getRateLimitRemaining(organizationId),
        });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("AI API error:", error);

    // Check if it's an OpenAI API error
    if (error instanceof Error && error.message.includes("API key")) {
      return NextResponse.json(
        { error: "AI service not configured. Please add your OpenAI API key." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper to get control from seed data
function getControlFromSeedData(controlId: string) {
  const index = parseInt(controlId.replace("control-", "")) - 1;
  if (index < 0 || index >= controlsData.length) return null;

  const c = controlsData[index];
  const framework = frameworksData.find(f => f.abbreviation === c.framework_abbreviation);
  const frameworkIndex = frameworksData.findIndex(f => f.abbreviation === c.framework_abbreviation);

  return {
    id: controlId,
    control_id: c.control_id,
    title: c.title,
    description: c.description,
    control_family: c.control_family,
    priority: c.priority,
    framework: framework ? {
      id: `framework-${frameworkIndex + 1}`,
      name: framework.name,
      abbreviation: framework.abbreviation,
    } : null,
  };
}

// Demo mode handler - provides responses without OpenAI
function handleDemoMode(action: string, organizationId: string, data: Record<string, unknown>) {
  switch (action) {
    case "gap_recommendation": {
      const { controlId } = data as { controlId: string };

      // Get control from seed data to determine recommendation
      const control = getControlFromSeedData(controlId as string);
      const family = control?.control_family || "default";
      const recommendation = demoRecommendations[family] || demoRecommendations.default;

      return NextResponse.json({
        recommendation,
        rateLimitRemaining: 10,
        demo: true,
      });
    }

    case "framework_suggestions": {
      // In demo mode, return general suggestions
      const suggestions = demoFrameworkSuggestions.default;

      return NextResponse.json({
        suggestions,
        rateLimitRemaining: 10,
        demo: true,
      });
    }

    case "chat": {
      const { messages } = data as { messages: Array<{ role: string; content: string }> };
      const lastMessage = messages?.[messages.length - 1]?.content || "";

      // Generate contextual demo response
      let response = `Thank you for your question about "${lastMessage.slice(0, 50)}${lastMessage.length > 50 ? "..." : ""}".

In demo mode, the AI assistant provides pre-configured responses. For full AI-powered assistance:

1. **Configure OpenAI API Key** - Add your OPENAI_API_KEY to environment variables
2. **Restart the application** - Changes take effect after restart

The AI assistant can help with:
- Framework recommendations based on your industry
- Gap analysis and remediation guidance
- Compliance questions and best practices
- Control implementation strategies

Would you like to proceed with setting up the AI integration?`;

      return NextResponse.json({
        response,
        rateLimitRemaining: 10,
        demo: true,
      });
    }

    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
}
