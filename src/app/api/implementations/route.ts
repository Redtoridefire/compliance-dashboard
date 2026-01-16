import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organizationId,
      controlId,
      controlNumber, // Human-readable control ID like "500.02(a)"
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

    // If Supabase is configured, use it (call as function for runtime check)
    if (isSupabaseConfigured()) {
      const supabase = createServerClient();

      // Check if implementation exists
      const { data: existing } = await supabase
        .from("control_implementations")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("control_id", controlId)
        .single();

      if (existing) {
        // Update existing implementation
        const updateData: Record<string, unknown> = {
          implementation_status: implementationStatus,
          implementation_notes: implementationNotes,
          evidence_urls: evidenceUrls || [],
          updated_at: new Date().toISOString(),
        };
        // Also update control_number if provided (for better matching later)
        if (controlNumber) {
          updateData.control_number = controlNumber;
        }
        const { data, error } = await supabase
          .from("control_implementations")
          .update(updateData)
          .eq("id", existing.id)
          .select()
          .single();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ implementation: data });
      } else {
        // Create new implementation
        const insertData: Record<string, unknown> = {
          organization_id: organizationId,
          control_id: controlId,
          implementation_status: implementationStatus,
          implementation_notes: implementationNotes,
          evidence_urls: evidenceUrls || [],
        };
        // Include control_number if provided (for better matching later)
        if (controlNumber) {
          insertData.control_number = controlNumber;
        }
        const { data, error } = await supabase
          .from("control_implementations")
          .insert(insertData)
          .select()
          .single();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ implementation: data });
      }
    } else {
      // Demo mode - return mock implementation
      const mockImplementation = {
        id: `impl-${Date.now()}`,
        organization_id: organizationId,
        control_id: controlId,
        implementation_status: implementationStatus,
        implementation_notes: implementationNotes,
        evidence_urls: evidenceUrls || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return NextResponse.json({
        implementation: mockImplementation,
        demo: true,
      });
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
    const body = await request.json();
    const { implementationId, ...updates } = body;

    if (!implementationId) {
      return NextResponse.json(
        { error: "implementationId is required" },
        { status: 400 }
      );
    }

    // If Supabase is configured, use it (call as function for runtime check)
    if (isSupabaseConfigured()) {
      const supabase = createServerClient();

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
    } else {
      // Demo mode - return mock updated implementation
      const mockImplementation = {
        id: implementationId,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      return NextResponse.json({
        implementation: mockImplementation,
        demo: true,
      });
    }
  } catch (error) {
    console.error("Implementations API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
