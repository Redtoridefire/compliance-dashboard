import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const severity = searchParams.get("severity");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    let query = supabase
      .from("gap_analysis")
      .select("*, control:controls(*, framework:frameworks(*))")
      .eq("organization_id", organizationId)
      .order("gap_severity");

    if (severity) {
      query = query.eq("gap_severity", severity);
    }

    const { data: gaps, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by severity for summary
    const summary = {
      critical: gaps?.filter((g) => g.gap_severity === "Critical").length || 0,
      high: gaps?.filter((g) => g.gap_severity === "High").length || 0,
      medium: gaps?.filter((g) => g.gap_severity === "Medium").length || 0,
      low: gaps?.filter((g) => g.gap_severity === "Low").length || 0,
      total: gaps?.length || 0,
    };

    return NextResponse.json({ gaps, summary });
  } catch (error) {
    console.error("Gaps API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { organizationId, action } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    if (action === "compute") {
      // Get selected frameworks
      const { data: orgFrameworks } = await supabase
        .from("organization_frameworks")
        .select("framework_id")
        .eq("organization_id", organizationId);

      const frameworkIds = orgFrameworks?.map((of) => of.framework_id) || [];

      if (frameworkIds.length === 0) {
        return NextResponse.json({
          message: "No frameworks selected",
          gaps: [],
          summary: { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
        });
      }

      // Get all controls for selected frameworks
      const { data: controls } = await supabase
        .from("controls")
        .select("*")
        .in("framework_id", frameworkIds);

      // Get implementations
      const { data: implementations } = await supabase
        .from("control_implementations")
        .select("*")
        .eq("organization_id", organizationId);

      const implMap = new Map(
        implementations?.map((i) => [i.control_id, i]) || []
      );

      // Clear existing gaps for this organization
      await supabase
        .from("gap_analysis")
        .delete()
        .eq("organization_id", organizationId);

      // Analyze gaps
      const gapsToInsert: Array<{
        organization_id: string;
        control_id: string;
        satisfies_frameworks: string[];
        gap_frameworks: string[];
        gap_severity: string;
        estimated_effort: string;
      }> = [];

      for (const control of controls || []) {
        const impl = implMap.get(control.id);
        const isImplemented = impl?.implementation_status === "Fully Implemented";
        const isPartial = impl?.implementation_status === "Partially Implemented";

        if (!isImplemented) {
          // Determine severity based on control priority
          let severity = "Medium";
          if (control.priority === "Critical") severity = "Critical";
          else if (control.priority === "High") severity = "High";
          else if (control.priority === "Low") severity = "Low";

          // Determine effort
          const effort = isPartial ? "Low" : control.priority === "Low" ? "Low" : "Medium";

          gapsToInsert.push({
            organization_id: organizationId,
            control_id: control.id,
            satisfies_frameworks: isPartial ? [control.framework_id] : [],
            gap_frameworks: [control.framework_id],
            gap_severity: severity,
            estimated_effort: effort,
          });
        }
      }

      // Insert new gaps
      if (gapsToInsert.length > 0) {
        await supabase.from("gap_analysis").insert(gapsToInsert);
      }

      // Fetch the newly created gaps
      const { data: gaps } = await supabase
        .from("gap_analysis")
        .select("*, control:controls(*, framework:frameworks(*))")
        .eq("organization_id", organizationId)
        .order("gap_severity");

      const summary = {
        critical: gaps?.filter((g) => g.gap_severity === "Critical").length || 0,
        high: gaps?.filter((g) => g.gap_severity === "High").length || 0,
        medium: gaps?.filter((g) => g.gap_severity === "Medium").length || 0,
        low: gaps?.filter((g) => g.gap_severity === "Low").length || 0,
        total: gaps?.length || 0,
      };

      return NextResponse.json({
        message: "Gap analysis computed successfully",
        gaps,
        summary,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Gaps API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
