import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get("industry");
    const category = searchParams.get("category");
    const organizationId = searchParams.get("organizationId");

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

    const { data: frameworks, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If organizationId provided, also fetch selected frameworks
    if (organizationId) {
      const { data: selectedFrameworks } = await supabase
        .from("organization_frameworks")
        .select("framework_id, compliance_status")
        .eq("organization_id", organizationId);

      const selectedIds = new Set(
        selectedFrameworks?.map((sf) => sf.framework_id) || []
      );
      const statusMap = new Map(
        selectedFrameworks?.map((sf) => [sf.framework_id, sf.compliance_status]) || []
      );

      const frameworksWithSelection = frameworks?.map((f) => ({
        ...f,
        isSelected: selectedIds.has(f.id),
        complianceStatus: statusMap.get(f.id) || null,
      }));

      return NextResponse.json({ frameworks: frameworksWithSelection });
    }

    return NextResponse.json({ frameworks });
  } catch (error) {
    console.error("Frameworks API error:", error);
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
    const { organizationId, frameworkId, action } = body;

    if (!organizationId || !frameworkId) {
      return NextResponse.json(
        { error: "Missing organizationId or frameworkId" },
        { status: 400 }
      );
    }

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

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Frameworks API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
