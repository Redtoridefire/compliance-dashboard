import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import frameworksData from "../../../../seed-data/frameworks.json";

// Convert seed data to match database format
function getSeedFrameworks() {
  return frameworksData.map((f, index) => ({
    id: `framework-${index + 1}`,
    name: f.name,
    abbreviation: f.abbreviation,
    category: f.category,
    description: f.description,
    version: f.version,
    applicable_industries: f.applicable_industries,
    documentation_url: f.documentation_url,
    is_active: true,
    created_at: new Date().toISOString(),
  }));
}

// Deduplicate frameworks by abbreviation (keep first occurrence)
function deduplicateFrameworks<T extends { abbreviation: string }>(frameworks: T[]): T[] {
  const seen = new Set<string>();
  return frameworks.filter((f) => {
    const key = f.abbreviation.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get("industry");
    const category = searchParams.get("category");
    const organizationId = searchParams.get("organizationId");

    let frameworks;
    let useDbFrameworks = false;

    // Try to fetch from Supabase if configured (call as function for runtime check)
    if (isSupabaseConfigured()) {
      const supabase = createServerClient();
      let query = supabase
        .from("frameworks")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (industry) {
        query = query.contains("applicable_industries", [industry]);
      }

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        frameworks = data;
        useDbFrameworks = true;
      }
    }

    // Fall back to seed data if no frameworks from Supabase
    if (!frameworks || frameworks.length === 0) {
      frameworks = getSeedFrameworks();

      // Apply filters to seed data
      if (industry) {
        frameworks = frameworks.filter((f) =>
          f.applicable_industries.some(
            (ind: string) => ind.toLowerCase().includes(industry.toLowerCase()) ||
                    industry.toLowerCase().includes(ind.toLowerCase())
          )
        );
      }

      if (category) {
        frameworks = frameworks.filter(
          (f) => f.category.toLowerCase() === category.toLowerCase()
        );
      }
    }

    // Deduplicate frameworks by abbreviation to prevent duplicates
    frameworks = deduplicateFrameworks(frameworks);

    // If organizationId provided, also fetch selected frameworks
    if (organizationId && isSupabaseConfigured()) {
      const supabase = createServerClient();
      const { data: selectedFrameworks } = await supabase
        .from("organization_frameworks")
        .select("framework_id, compliance_status")
        .eq("organization_id", organizationId);

      // Create sets for both ID and abbreviation-based matching
      const selectedIds = new Set(
        selectedFrameworks?.map((sf) => sf.framework_id) || []
      );
      const statusMap = new Map(
        selectedFrameworks?.map((sf) => [sf.framework_id, sf.compliance_status]) || []
      );

      // If using DB frameworks, also try to match by looking up abbreviations
      // This handles cases where organization_frameworks has different ID formats
      let abbreviationToSelectedId = new Map<string, string>();
      if (useDbFrameworks && selectedFrameworks && selectedFrameworks.length > 0) {
        // Get the full framework info for selected frameworks to get abbreviations
        const { data: selectedFrameworkDetails } = await supabase
          .from("frameworks")
          .select("id, abbreviation")
          .in("id", Array.from(selectedIds));

        selectedFrameworkDetails?.forEach((sf) => {
          abbreviationToSelectedId.set(sf.abbreviation.toLowerCase(), sf.id);
        });
      }

      const frameworksWithSelection = frameworks?.map((f) => {
        // Check if selected by ID or by abbreviation match
        const isSelectedById = selectedIds.has(f.id);
        const matchedId = abbreviationToSelectedId.get(f.abbreviation.toLowerCase());
        const isSelectedByAbbr = matchedId ? selectedIds.has(matchedId) : false;
        const isSelected = isSelectedById || isSelectedByAbbr;

        // Get compliance status from either the direct ID or the matched ID
        const complianceStatus = statusMap.get(f.id) ||
          (matchedId ? statusMap.get(matchedId) : null);

        return {
          ...f,
          isSelected,
          complianceStatus,
        };
      });

      return NextResponse.json({ frameworks: frameworksWithSelection });
    }

    // For demo mode, check localStorage selections (passed via header or stored server-side)
    // For simplicity, return all frameworks without selection status in demo mode
    return NextResponse.json({ frameworks });
  } catch (error) {
    console.error("Frameworks API error:", error);
    // Return seed data as fallback on any error
    return NextResponse.json({ frameworks: deduplicateFrameworks(getSeedFrameworks()) });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, frameworkId, action } = body;

    if (!organizationId || !frameworkId) {
      return NextResponse.json(
        { error: "Missing organizationId or frameworkId" },
        { status: 400 }
      );
    }

    // If Supabase is configured, use it (call as function for runtime check)
    if (isSupabaseConfigured()) {
      const supabase = createServerClient();

      if (action === "select") {
        const { error } = await supabase.from("organization_frameworks").insert({
          organization_id: organizationId,
          framework_id: frameworkId,
          compliance_status: "Not Started",
        });

        if (error) {
          if (error.code === "23505") {
            return NextResponse.json(
              { error: "Framework already selected" },
              { status: 400 }
            );
          }
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      if (action === "unselect") {
        const { error } = await supabase
          .from("organization_frameworks")
          .delete()
          .eq("organization_id", organizationId)
          .eq("framework_id", frameworkId);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      if (action === "updateStatus") {
        const { status } = body;
        const { error } = await supabase
          .from("organization_frameworks")
          .update({ compliance_status: status })
          .eq("organization_id", organizationId)
          .eq("framework_id", frameworkId);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }
    } else {
      // Demo mode - just return success (selections handled client-side)
      return NextResponse.json({ success: true, demo: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Frameworks API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
