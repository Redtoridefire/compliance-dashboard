import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import controlsData from "../../../../seed-data/controls.json";
import frameworksData from "../../../../seed-data/frameworks.json";

// Create framework ID map from seed data
function getFrameworkIdMap() {
  const map: Record<string, string> = {};
  frameworksData.forEach((f, index) => {
    map[f.abbreviation] = `framework-${index + 1}`;
  });
  return map;
}

// Convert seed data to match database format
function getSeedControls() {
  const frameworkMap = getFrameworkIdMap();
  return controlsData.map((c, index) => ({
    id: `control-${index + 1}`,
    framework_id: frameworkMap[c.framework_abbreviation] || `framework-unknown`,
    control_id: c.control_id,
    title: c.title,
    description: c.description,
    control_family: c.control_family,
    priority: c.priority,
    implementation_guidance: c.implementation_guidance,
    created_at: new Date().toISOString(),
    framework: frameworksData.find(f => f.abbreviation === c.framework_abbreviation) ? {
      id: frameworkMap[c.framework_abbreviation],
      name: frameworksData.find(f => f.abbreviation === c.framework_abbreviation)?.name,
      abbreviation: c.framework_abbreviation,
    } : null,
  }));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const frameworkId = searchParams.get("frameworkId");
    const controlFamily = searchParams.get("controlFamily");

    let controls;
    let implementations: Array<{ control_id: string; implementation_status: string; implementation_notes?: string; control_number?: string }> = [];

    // Try to fetch from Supabase if configured (call as function for runtime check)
    if (isSupabaseConfigured() && organizationId) {
      const supabase = createServerClient();

      // Get organization's selected frameworks
      const { data: orgFrameworks } = await supabase
        .from("organization_frameworks")
        .select("framework_id")
        .eq("organization_id", organizationId);

      const frameworkIds = orgFrameworks?.map((of) => of.framework_id) || [];

      if (frameworkIds.length > 0) {
        // Build controls query
        let controlsQuery = supabase
          .from("controls")
          .select("*, framework:frameworks(*)")
          .in("framework_id", frameworkIds)
          .order("control_family")
          .order("control_id");

        if (frameworkId) {
          controlsQuery = controlsQuery.eq("framework_id", frameworkId);
        }

        if (controlFamily) {
          controlsQuery = controlsQuery.eq("control_family", controlFamily);
        }

        const { data: controlsFromDb } = await controlsQuery;

        if (controlsFromDb && controlsFromDb.length > 0) {
          controls = controlsFromDb;

          // Get implementations
          const { data: implData } = await supabase
            .from("control_implementations")
            .select("*")
            .eq("organization_id", organizationId);

          implementations = implData || [];
        }
      }
    }

    // Fall back to seed data if no controls from Supabase
    if (!controls || controls.length === 0) {
      controls = getSeedControls();

      // Apply filters to seed data
      if (frameworkId) {
        controls = controls.filter((c) => c.framework_id === frameworkId);
      }

      if (controlFamily) {
        controls = controls.filter(
          (c) => c.control_family.toLowerCase() === controlFamily.toLowerCase()
        );
      }
    }

    // Create implementation map - use multiple keys for matching
    // Key by both control_id (the UUID/seed ID) and control_number (human-readable like "500.02(a)")
    type Implementation = (typeof implementations)[number];
    const implementationMapById: Record<string, Implementation> = {};
    const implementationMapByNumber: Record<string, Implementation> = {};
    implementations?.forEach((impl) => {
      if (impl.control_id) {
        implementationMapById[impl.control_id] = impl;
      }
      // If implementation has control_number stored, also map by that
      if (impl.control_number) {
        implementationMapByNumber[impl.control_number] = impl;
      }
    });

    // Combine controls with implementations - try ID first, then human-readable control_id
    const controlsWithImplementation = controls?.map((control) => ({
      ...control,
      implementation: implementationMapById[control.id] ||
                      implementationMapByNumber[control.control_id] ||
                      null,
    }));

    // Get unique control families
    const controlFamilies = [...new Set(controls?.map((c) => c.control_family) || [])].sort();

    return NextResponse.json({
      controls: controlsWithImplementation,
      controlFamilies,
      total: controls?.length || 0,
    });
  } catch (error) {
    console.error("Controls API error:", error);
    // Return seed data as fallback on any error
    const seedControls = getSeedControls();
    const controlFamilies = [...new Set(seedControls.map((c) => c.control_family))].sort();
    return NextResponse.json({
      controls: seedControls.map(c => ({ ...c, implementation: null })),
      controlFamilies,
      total: seedControls.length,
    });
  }
}
