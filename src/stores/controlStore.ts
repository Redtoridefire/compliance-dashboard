import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type {
  Control,
  ControlImplementation,
  ControlWithImplementation,
  ControlMapping,
  ControlFilters,
  GapAnalysis,
  GapFilters,
} from "@/types";

interface ControlState {
  // Data
  controls: Control[];
  implementations: Map<string, ControlImplementation>;
  controlsWithImplementation: ControlWithImplementation[];
  mappings: ControlMapping[];
  gaps: GapAnalysis[];

  // Filters
  filters: ControlFilters;
  gapFilters: GapFilters;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  fetchControls: (frameworkIds?: string[]) => Promise<void>;
  fetchControlsForOrganization: (organizationId: string) => Promise<void>;
  fetchImplementations: (organizationId: string) => Promise<void>;
  updateImplementation: (
    organizationId: string,
    controlId: string,
    status: string,
    notes?: string
  ) => Promise<void>;
  fetchMappings: (controlId?: string) => Promise<void>;
  fetchGaps: (organizationId: string) => Promise<void>;
  computeGapAnalysis: (organizationId: string) => Promise<void>;
  setFilters: (filters: Partial<ControlFilters>) => void;
  setGapFilters: (filters: Partial<GapFilters>) => void;
  getFilteredControls: () => ControlWithImplementation[];
  getFilteredGaps: () => GapAnalysis[];
  getControlFamilies: () => string[];
  clearError: () => void;
}

export const useControlStore = create<ControlState>((set, get) => ({
  controls: [],
  implementations: new Map(),
  controlsWithImplementation: [],
  mappings: [],
  gaps: [],
  filters: {},
  gapFilters: {},
  isLoading: false,
  isSaving: false,
  error: null,

  fetchControls: async (frameworkIds?: string[]) => {
    set({ isLoading: true, error: null });
    try {
      let query = supabase
        .from("controls")
        .select("*, framework:frameworks(*)")
        .order("control_family")
        .order("control_id");

      if (frameworkIds && frameworkIds.length > 0) {
        query = query.in("framework_id", frameworkIds);
      }

      const { data, error } = await query;

      if (error) throw error;
      set({ controls: data || [], isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch controls",
        isLoading: false,
      });
    }
  },

  fetchControlsForOrganization: async (organizationId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Get organization's selected frameworks
      const { data: orgFrameworks } = await supabase
        .from("organization_frameworks")
        .select("framework_id")
        .eq("organization_id", organizationId);

      const frameworkIds = orgFrameworks?.map((of) => of.framework_id) || [];

      if (frameworkIds.length === 0) {
        set({ controlsWithImplementation: [], isLoading: false });
        return;
      }

      // Get controls for selected frameworks
      const { data: controls, error: controlsError } = await supabase
        .from("controls")
        .select("*, framework:frameworks(*)")
        .in("framework_id", frameworkIds)
        .order("control_family")
        .order("control_id");

      if (controlsError) throw controlsError;

      // Get implementations
      const { data: implementations, error: implError } = await supabase
        .from("control_implementations")
        .select("*")
        .eq("organization_id", organizationId);

      if (implError) throw implError;

      // Create implementation map
      const implMap = new Map<string, ControlImplementation>();
      implementations?.forEach((impl) => {
        implMap.set(impl.control_id, impl);
      });

      // Combine controls with implementations
      const controlsWithImpl: ControlWithImplementation[] = (controls || []).map(
        (control) => ({
          ...control,
          implementation: implMap.get(control.id),
        })
      );

      set({
        controls: controls || [],
        implementations: implMap,
        controlsWithImplementation: controlsWithImpl,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch controls",
        isLoading: false,
      });
    }
  },

  fetchImplementations: async (organizationId: string) => {
    try {
      const { data, error } = await supabase
        .from("control_implementations")
        .select("*")
        .eq("organization_id", organizationId);

      if (error) throw error;

      const implMap = new Map<string, ControlImplementation>();
      data?.forEach((impl) => {
        implMap.set(impl.control_id, impl);
      });

      set({ implementations: implMap });
    } catch (error) {
      console.error("Error fetching implementations:", error);
    }
  },

  updateImplementation: async (
    organizationId: string,
    controlId: string,
    status: string,
    notes?: string
  ) => {
    set({ isSaving: true });
    try {
      const existing = get().implementations.get(controlId);

      if (existing) {
        // Update existing implementation
        const { error } = await supabase
          .from("control_implementations")
          .update({
            implementation_status: status,
            implementation_notes: notes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Create new implementation
        const { error } = await supabase.from("control_implementations").insert({
          organization_id: organizationId,
          control_id: controlId,
          implementation_status: status,
          implementation_notes: notes,
        });

        if (error) throw error;
      }

      // Refresh implementations
      await get().fetchImplementations(organizationId);

      // Update controlsWithImplementation - use existing controlsWithImplementation as source
      // since it contains the framework data from the initial fetch
      const implMap = get().implementations;
      const updatedControlsWithImpl = get().controlsWithImplementation.map((control) => ({
        ...control,
        implementation: implMap.get(control.id),
      }));

      set({ controlsWithImplementation: updatedControlsWithImpl, isSaving: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to update implementation",
        isSaving: false,
      });
    }
  },

  fetchMappings: async (controlId?: string) => {
    try {
      let query = supabase
        .from("control_mappings")
        .select(
          `
          *,
          source_control:controls!control_mappings_source_control_id_fkey(*, framework:frameworks(*)),
          target_control:controls!control_mappings_target_control_id_fkey(*, framework:frameworks(*))
        `
        );

      if (controlId) {
        query = query.or(
          `source_control_id.eq.${controlId},target_control_id.eq.${controlId}`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      set({ mappings: data || [] });
    } catch (error) {
      console.error("Error fetching mappings:", error);
    }
  },

  fetchGaps: async (organizationId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from("gap_analysis")
        .select("*, control:controls(*, framework:frameworks(*))")
        .eq("organization_id", organizationId)
        .order("gap_severity");

      if (error) throw error;
      set({ gaps: data || [], isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch gaps",
        isLoading: false,
      });
    }
  },

  computeGapAnalysis: async (organizationId: string) => {
    set({ isLoading: true });
    try {
      // Get selected frameworks
      const { data: orgFrameworks } = await supabase
        .from("organization_frameworks")
        .select("framework_id")
        .eq("organization_id", organizationId);

      const frameworkIds = orgFrameworks?.map((of) => of.framework_id) || [];

      if (frameworkIds.length === 0) {
        set({ gaps: [], isLoading: false });
        return;
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

      // Analyze gaps
      const gaps: Array<{
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

          // Determine effort based on whether it's partially implemented
          const effort = isPartial ? "Low" : "Medium";

          gaps.push({
            organization_id: organizationId,
            control_id: control.id,
            satisfies_frameworks: isPartial ? [control.framework_id] : [],
            gap_frameworks: [control.framework_id],
            gap_severity: severity,
            estimated_effort: effort,
          });
        }
      }

      // Upsert gap analysis records
      if (gaps.length > 0) {
        for (const gap of gaps) {
          await supabase
            .from("gap_analysis")
            .upsert(gap, { onConflict: "organization_id,control_id" });
        }
      }

      // Fetch updated gaps
      await get().fetchGaps(organizationId);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to compute gap analysis",
        isLoading: false,
      });
    }
  },

  setFilters: (filters: Partial<ControlFilters>) => {
    set({ filters: { ...get().filters, ...filters } });
  },

  setGapFilters: (filters: Partial<GapFilters>) => {
    set({ gapFilters: { ...get().gapFilters, ...filters } });
  },

  getFilteredControls: () => {
    const { controlsWithImplementation, filters } = get();

    return controlsWithImplementation.filter((control) => {
      if (filters.frameworkId && control.framework_id !== filters.frameworkId) {
        return false;
      }
      if (filters.controlFamily && control.control_family !== filters.controlFamily) {
        return false;
      }
      if (filters.priority && control.priority !== filters.priority) {
        return false;
      }
      if (
        filters.implementationStatus &&
        control.implementation?.implementation_status !== filters.implementationStatus
      ) {
        if (
          filters.implementationStatus === "Not Implemented" &&
          control.implementation
        ) {
          return false;
        }
        if (
          filters.implementationStatus !== "Not Implemented" &&
          !control.implementation
        ) {
          return false;
        }
      }
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        return (
          control.title.toLowerCase().includes(query) ||
          control.control_id.toLowerCase().includes(query) ||
          control.description?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  },

  getFilteredGaps: () => {
    const { gaps, gapFilters } = get();

    return gaps.filter((gap) => {
      if (gapFilters.severity && gap.gap_severity !== gapFilters.severity) {
        return false;
      }
      if (
        gapFilters.frameworkId &&
        !gap.gap_frameworks.includes(gapFilters.frameworkId)
      ) {
        return false;
      }
      if (gapFilters.searchQuery) {
        const query = gapFilters.searchQuery.toLowerCase();
        const control = (gap as any).control;
        return (
          control?.title?.toLowerCase().includes(query) ||
          control?.control_id?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  },

  getControlFamilies: () => {
    const controls = get().controls;
    const families = new Set(controls.map((c) => c.control_family));
    return Array.from(families).sort();
  },

  clearError: () => set({ error: null }),
}));
