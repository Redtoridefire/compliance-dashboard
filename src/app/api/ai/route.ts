import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import {
  generateGapRecommendation,
  suggestFrameworks,
  generateChatResponse,
  checkRateLimit,
  getRateLimitRemaining,
} from "@/lib/openai";

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

    const supabase = createServerClient();

    switch (action) {
      case "gap_recommendation": {
        const { controlId } = data;

        // Fetch control details
        const { data: control, error: controlError } = await supabase
          .from("controls")
          .select("*, framework:frameworks(*)")
          .eq("id", controlId)
          .single();

        if (controlError || !control) {
          return NextResponse.json(
            { error: "Control not found" },
            { status: 404 }
          );
        }

        // Fetch implementation
        const { data: implementation } = await supabase
          .from("control_implementations")
          .select("*")
          .eq("organization_id", organizationId)
          .eq("control_id", controlId)
          .single();

        // Find mapped controls in other frameworks
        const { data: mappings } = await supabase
          .from("control_mappings")
          .select(
            `
            *,
            target_control:controls!control_mappings_target_control_id_fkey(*, framework:frameworks(*))
          `
          )
          .eq("source_control_id", controlId);

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

        // Log the interaction
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

        return NextResponse.json({
          recommendation,
          rateLimitRemaining: getRateLimitRemaining(organizationId),
        });
      }

      case "framework_suggestions": {
        // Fetch organization details
        const { data: organization, error: orgError } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", organizationId)
          .single();

        if (orgError || !organization) {
          return NextResponse.json(
            { error: "Organization not found" },
            { status: 404 }
          );
        }

        // Fetch available frameworks
        const { data: frameworks } = await supabase
          .from("frameworks")
          .select("*")
          .eq("is_active", true);

        const suggestions = await suggestFrameworks({
          organization,
          availableFrameworks: frameworks || [],
        });

        // Log the interaction
        await supabase.from("ai_interactions").insert({
          organization_id: organizationId,
          interaction_type: "recommendation",
          prompt: "Framework selection assistance",
          response: suggestions,
          context: { industry: organization.industry },
        });

        return NextResponse.json({
          suggestions,
          rateLimitRemaining: getRateLimitRemaining(organizationId),
        });
      }

      case "chat": {
        const { messages } = data;

        // Fetch organization details
        const { data: organization, error: orgError } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", organizationId)
          .single();

        if (orgError || !organization) {
          return NextResponse.json(
            { error: "Organization not found" },
            { status: 404 }
          );
        }

        // Fetch selected frameworks
        const { data: orgFrameworks } = await supabase
          .from("organization_frameworks")
          .select("*, framework:frameworks(*)")
          .eq("organization_id", organizationId);

        const selectedFrameworks =
          orgFrameworks?.map((of) => of.framework as any) || [];

        // Calculate compliance score
        const { data: implementations } = await supabase
          .from("control_implementations")
          .select("implementation_status")
          .eq("organization_id", organizationId);

        const implemented =
          implementations?.filter(
            (i) => i.implementation_status === "Fully Implemented"
          ).length || 0;
        const total = implementations?.length || 1;
        const complianceScore = Math.round((implemented / total) * 100);

        // Generate response
        const response = await generateChatResponse(messages, {
          organization,
          selectedFrameworks,
          complianceScore,
        });

        // Log the interaction
        const userMessage = messages[messages.length - 1]?.content || "";
        await supabase.from("ai_interactions").insert({
          organization_id: organizationId,
          interaction_type: "chat",
          prompt: userMessage,
          response,
          context: { messageCount: messages.length },
        });

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
