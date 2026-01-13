import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const frameworkId = searchParams.get("frameworkId");
    const controlFamily = searchParams.get("controlFamily");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    // Get organization's selected frameworks
    const { data: orgFrameworks } = await supabase
      .from("organization_frameworks")
      .select("framework_id")
      .eq("organization_id", organizationId);

    const frameworkIds = orgFrameworks?.map((of) => of.framework_id) || [];

    if (frameworkIds.length === 0) {
      return NextResponse.json({ controls: [], implementations: {} });
    }

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

    const { data: controls, error: controlsError } = await controlsQuery;

    if (controlsError) {
      return NextResponse.json(
        { error: controlsError.message },
        { status: 500 }
      );
    }

    // Get implementations
    const { data: implementations } = await supabase
      .from("control_implementations")
      .select("*")
      .eq("organization_id", organizationId);

    // Create implementation map
    type Implementation = NonNullable<typeof implementations>[number];
    const implementationMap: Record<string, Implementation> = {};
    implementations?.forEach((impl) => {
      if (impl.control_id) {
        implementationMap[impl.control_id] = impl;
      }
    });

    // Combine controls with implementations
    const controlsWithImplementation = controls?.map((control) => ({
      ...control,
      implementation: implementationMap[control.id] || null,
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
