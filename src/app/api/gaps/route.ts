import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import controlsData from "../../../../seed-data/controls.json";
import frameworksData from "../../../../seed-data/frameworks.json";

// Helper to generate demo gaps from seed data
function generateDemoGaps(selectedFrameworkIds?: string[]) {
  const frameworkMap: Record<string, string> = {};
  frameworksData.forEach((f, index) => {
    frameworkMap[f.abbreviation] = `framework-${index + 1}`;
  });

  // Filter controls by selected frameworks or use all
  let controls = controlsData.map((c, index) => ({
    id: `control-${index + 1}`,
    framework_id: frameworkMap[c.framework_abbreviation],
    control_id: c.control_id,
    title: c.title,
    description: c.description,
    control_family: c.control_family,
    priority: c.priority,
    framework: {
      id: frameworkMap[c.framework_abbreviation],
      name: frameworksData.find(f => f.abbreviation === c.framework_abbreviation)?.name,
      abbreviation: c.framework_abbreviation,
    },
  }));

  if (selectedFrameworkIds && selectedFrameworkIds.length > 0) {
    controls = controls.filter(c => selectedFrameworkIds.includes(c.framework_id));
  }

  // Generate gaps (simulate ~60% not implemented)
  const gaps = controls
    .filter((_, index) => index % 3 !== 0) // ~66% have gaps
    .map((control, index) => ({
      id: `gap-${index + 1}`,
      organization_id: "demo",
      control_id: control.id,
      satisfies_frameworks: [],
      gap_frameworks: [control.framework_id],
      gap_severity: control.priority === "Critical" ? "Critical" :
                    control.priority === "High" ? "High" :
                    control.priority === "Low" ? "Low" : "Medium",
      estimated_effort: control.priority === "Low" ? "Low" : "Medium",
      ai_recommendation: null,
      control: control,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

  return gaps;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const severity = searchParams.get("severity");

    let gaps;

    // Try Supabase if configured (call as function for runtime check)
    if (isSupabaseConfigured() && organizationId) {
      const supabase = createServerClient();
      let query = supabase
        .from("gap_analysis")
        .select("*, control:controls(*, framework:frameworks(*))")
        .eq("organization_id", organizationId)
        .order("gap_severity");

      if (severity) {
        query = query.eq("gap_severity", severity);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        gaps = data;
      }
    }

    // Fall back to demo data
    if (!gaps || gaps.length === 0) {
      gaps = generateDemoGaps();

      if (severity) {
        gaps = gaps.filter(g => g.gap_severity === severity);
      }
    }

    // Group by severity for summary
    const summary = {
      critical: gaps.filter((g) => g.gap_severity === "Critical").length,
      high: gaps.filter((g) => g.gap_severity === "High").length,
      medium: gaps.filter((g) => g.gap_severity === "Medium").length,
      low: gaps.filter((g) => g.gap_severity === "Low").length,
      total: gaps.length,
    };

    return NextResponse.json({ gaps, summary });
  } catch (error) {
    console.error("Gaps API error:", error);
    // Return demo data on error
    const gaps = generateDemoGaps();
    const summary = {
      critical: gaps.filter((g) => g.gap_severity === "Critical").length,
      high: gaps.filter((g) => g.gap_severity === "High").length,
      medium: gaps.filter((g) => g.gap_severity === "Medium").length,
      low: gaps.filter((g) => g.gap_severity === "Low").length,
      total: gaps.length,
    };
    return NextResponse.json({ gaps, summary });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, action } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    if (action === "compute") {
      // If Supabase is configured, use it (call as function for runtime check)
      if (isSupabaseConfigured()) {
        const supabase = createServerClient();

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
            let severity = "Medium";
            if (control.priority === "Critical") severity = "Critical";
            else if (control.priority === "High") severity = "High";
            else if (control.priority === "Low") severity = "Low";

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
      } else {
        // Demo mode - return generated gaps
        const gaps = generateDemoGaps();
        const summary = {
          critical: gaps.filter((g) => g.gap_severity === "Critical").length,
          high: gaps.filter((g) => g.gap_severity === "High").length,
          medium: gaps.filter((g) => g.gap_severity === "Medium").length,
          low: gaps.filter((g) => g.gap_severity === "Low").length,
          total: gaps.length,
        };

        return NextResponse.json({
          message: "Gap analysis computed (demo mode)",
          gaps,
          summary,
          demo: true,
        });
      }
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
