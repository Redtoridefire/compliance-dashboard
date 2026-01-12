import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const {
      organizationId,
      controlId,
      implementationStatus,
      implementationNotes,
      evidenceUrls,
    } = body;

    if (!organizationId || !controlId) {
      return NextResponse.json(
        { error: "organizationId and controlId are required" },
        { status: 400 }
      );
    }

    // Check if implementation exists
    const { data: existing } = await supabase
      .from("control_implementations")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("control_id", controlId)
      .single();

    if (existing) {
      // Update existing implementation
      const { data, error } = await supabase
        .from("control_implementations")
        .update({
          implementation_status: implementationStatus,
          implementation_notes: implementationNotes,
          evidence_urls: evidenceUrls || [],
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ implementation: data });
    } else {
      // Create new implementation
      const { data, error } = await supabase
        .from("control_implementations")
        .insert({
          organization_id: organizationId,
          control_id: controlId,
          implementation_status: implementationStatus,
          implementation_notes: implementationNotes,
          evidence_urls: evidenceUrls || [],
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ implementation: data });
    }
  } catch (error) {
    console.error("Implementations API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { implementationId, ...updates } = body;

    if (!implementationId) {
      return NextResponse.json(
        { error: "implementationId is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.implementationStatus !== undefined) {
      updateData.implementation_status = updates.implementationStatus;
    }
    if (updates.implementationNotes !== undefined) {
      updateData.implementation_notes = updates.implementationNotes;
    }
    if (updates.evidenceUrls !== undefined) {
      updateData.evidence_urls = updates.evidenceUrls;
    }
    if (updates.assignedTo !== undefined) {
      updateData.assigned_to = updates.assignedTo;
    }
    if (updates.lastReviewedAt !== undefined) {
      updateData.last_reviewed_at = updates.lastReviewedAt;
    }
    if (updates.lastReviewedBy !== undefined) {
      updateData.last_reviewed_by = updates.lastReviewedBy;
    }

    const { data, error } = await supabase
      .from("control_implementations")
      .update(updateData)
      .eq("id", implementationId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ implementation: data });
  } catch (error) {
    console.error("Implementations API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
