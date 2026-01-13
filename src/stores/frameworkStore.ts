import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type {
  Framework,
  OrganizationFramework,
  FrameworkWithStats,
  FrameworkComplianceScore,
} from "@/types";

interface FrameworkState {
  // Data
  frameworks: Framework[];
  selectedFrameworks: OrganizationFramework[];
  frameworkStats: FrameworkComplianceScore[];

  // Loading states
  isLoading: boolean;
  isLoadingStats: boolean;
  error: string | null;

  // Actions
  fetchFrameworks: () => Promise<void>;
  fetchSelectedFrameworks: (organizationId: string) => Promise<void>;
  fetchFrameworkStats: (organizationId: string) => Promise<void>;
  selectFramework: (organizationId: string, frameworkId: string) => Promise<void>;
  unselectFramework: (organizationId: string, frameworkId: string) => Promise<void>;
  updateComplianceStatus: (
    organizationId: string,
    frameworkId: string,
    status: string
  ) => Promise<void>;
  getFrameworkById: (id: string) => Framework | undefined;
  getFrameworksByIndustry: (industry: string) => Framework[];
  clearError: () => void;
}

export const useFrameworkStore = create<FrameworkState>((set, get) => ({
  frameworks: [],
  selectedFrameworks: [],
  frameworkStats: [],
  isLoading: false,
  isLoadingStats: false,
  error: null,

  fetchFrameworks: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("frameworks")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      set({ frameworks: data || [], isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch frameworks",
        isLoading: false,
      });
    }
  },

  fetchSelectedFrameworks: async (organizationId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("organization_frameworks")
        .select("*, framework:frameworks(*)")
        .eq("organization_id", organizationId);

      if (error) throw error;
      set({ selectedFrameworks: data || [], isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch selected frameworks",
        isLoading: false,
      });
    }
  },

  fetchFrameworkStats: async (organizationId: string) => {
    set({ isLoadingStats: true });
    try {
      // Get selected frameworks with their controls and implementations
      const { data: orgFrameworks, error: ofError } = await supabase
        .from("organization_frameworks")
        .select("framework_id, compliance_status, framework:frameworks(*)")
        .eq("organization_id", organizationId);

      if (ofError) throw ofError;

      const stats: FrameworkComplianceScore[] = [];

      for (const of of orgFrameworks || []) {
        const framework = of.framework as unknown as Framework;

        // Get total controls for this framework
        const { count: totalControls } = await supabase
          .from("controls")
          .select("*", { count: "exact", head: true })
          .eq("framework_id", of.framework_id);

        // Get implemented controls
        const { data: implementations } = await supabase
          .from("control_implementations")
          .select("implementation_status, control:controls!inner(framework_id)")
          .eq("organization_id", organizationId)
          .eq("controls.framework_id", of.framework_id);

        const implemented = implementations?.filter(
          (i) => i.implementation_status === "Fully Implemented"
        ).length || 0;

        const partial = implementations?.filter(
          (i) => i.implementation_status === "Partially Implemented"
        ).length || 0;

        const total = totalControls || 0;
        const percentage = total > 0 ? Math.round((implemented / total) * 100) : 0;

        stats.push({
          frameworkId: of.framework_id,
          frameworkName: framework.name,
          frameworkAbbreviation: framework.abbreviation,
          totalControls: total,
          implementedControls: implemented,
          partiallyImplementedControls: partial,
          compliancePercentage: percentage,
          status: of.compliance_status,
        });
      }

      set({ frameworkStats: stats, isLoadingStats: false });
    } catch (error) {
      console.error("Error fetching framework stats:", error);
      set({ isLoadingStats: false });
    }
  },

  selectFramework: async (organizationId: string, frameworkId: string) => {
    try {
      const { error } = await supabase.from("organization_frameworks").insert({
        organization_id: organizationId,
        framework_id: frameworkId,
        compliance_status: "Not Started",
      });

      if (error) throw error;
      await get().fetchSelectedFrameworks(organizationId);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to select framework",
      });
    }
  },

  unselectFramework: async (organizationId: string, frameworkId: string) => {
    try {
      const { error } = await supabase
        .from("organization_frameworks")
        .delete()
        .eq("organization_id", organizationId)
        .eq("framework_id", frameworkId);

      if (error) throw error;
      await get().fetchSelectedFrameworks(organizationId);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to unselect framework",
      });
    }
  },

  updateComplianceStatus: async (
    organizationId: string,
    frameworkId: string,
    status: string
  ) => {
    try {
      const { error } = await supabase
        .from("organization_frameworks")
        .update({ compliance_status: status })
        .eq("organization_id", organizationId)
        .eq("framework_id", frameworkId);

      if (error) throw error;
      await get().fetchSelectedFrameworks(organizationId);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to update compliance status",
      });
    }
  },

  getFrameworkById: (id: string) => {
    return get().frameworks.find((f) => f.id === id);
  },

  getFrameworksByIndustry: (industry: string) => {
    return get().frameworks.filter(
      (f) =>
        f.applicable_industries.includes(industry) ||
        f.applicable_industries.includes("other")
    );
  },

  clearError: () => set({ error: null }),
}));
