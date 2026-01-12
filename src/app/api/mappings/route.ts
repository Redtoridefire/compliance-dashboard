import { NextRequest, NextResponse } from "next/server";
import controlMappingsData from "../../../../seed-data/control-mappings.json";

export async function GET(request: NextRequest) {
  try {
    // Return all mappings from seed data
    // In production, this would query Supabase
    return NextResponse.json({
      mappings: controlMappingsData,
      total: controlMappingsData.length
    });
  } catch (error) {
    console.error("Error fetching mappings:", error);
    return NextResponse.json(
      { error: "Failed to fetch mappings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, source_control_id, target_control_id, mapping_type, confidence_score, notes } = body;

    if (action === "create") {
      // Create a new mapping
      const newMapping = {
        id: `mapping-${Date.now()}`,
        source_control_id,
        target_control_id,
        mapping_type: mapping_type || "related",
        confidence_score: confidence_score || 0.7,
        notes: notes || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // In production, this would insert into Supabase
      return NextResponse.json({
        success: true,
        mapping: newMapping
      });
    }

    if (action === "update") {
      const { mapping_id } = body;
      // In production, this would update in Supabase
      return NextResponse.json({
        success: true,
        mapping_id,
        updated: { mapping_type, confidence_score, notes }
      });
    }

    if (action === "delete") {
      const { mapping_id } = body;
      // In production, this would delete from Supabase
      return NextResponse.json({
        success: true,
        deleted: mapping_id
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing mapping request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
