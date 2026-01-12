"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  ChevronDown,
  Check,
  Plus,
  Settings,
  Loader2,
} from "lucide-react";

interface Organization {
  id: string;
  name: string;
  industry: string;
  role: string;
}

interface OrgSwitcherProps {
  currentOrgId?: string;
  currentOrgName?: string;
  compact?: boolean;
}

export function OrgSwitcher({ currentOrgId, currentOrgName, compact = false }: OrgSwitcherProps) {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    setIsLoading(true);
    try {
      // Get current session
      const sessionStr = localStorage.getItem("cybercomply_session");
      if (!sessionStr) return;

      const session = JSON.parse(sessionStr);

      // In a real app, this would fetch all orgs the user belongs to
      // For MVP, we'll show the current org and allow creating new ones
      const currentOrg: Organization = {
        id: session.organization_id || currentOrgId || "",
        name: session.organization_name || currentOrgName || "My Organization",
        industry: session.industry || "Financial Services",
        role: session.role || "admin",
      };

      // Check if there are cached organizations
      const cachedOrgsStr = localStorage.getItem("cybercomply_organizations");
      if (cachedOrgsStr) {
        const cachedOrgs = JSON.parse(cachedOrgsStr);
        // Merge current org with cached orgs
        const orgMap = new Map<string, Organization>();
        cachedOrgs.forEach((org: Organization) => orgMap.set(org.id, org));
        orgMap.set(currentOrg.id, currentOrg);
        setOrganizations(Array.from(orgMap.values()));
      } else {
        setOrganizations([currentOrg]);
      }
    } catch (error) {
      console.error("Error loading organizations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const switchOrganization = async (org: Organization) => {
    if (org.id === currentOrgId) return;

    setIsSwitching(true);
    try {
      // Update session with new organization
      const sessionStr = localStorage.getItem("cybercomply_session");
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        const updatedSession = {
          ...session,
          organization_id: org.id,
          organization_name: org.name,
          industry: org.industry,
          role: org.role,
        };
        localStorage.setItem("cybercomply_session", JSON.stringify(updatedSession));

        // Refresh the page to load new org data
        router.refresh();
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error switching organization:", error);
    } finally {
      setIsSwitching(false);
    }
  };

  const createNewOrganization = () => {
    router.push("/onboarding?newOrg=true");
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-cyber-primary/20 text-cyber-primary text-xs">Admin</Badge>;
      case "user":
        return <Badge className="bg-cyber-secondary/20 text-cyber-secondary text-xs">User</Badge>;
      case "viewer":
        return <Badge variant="outline" className="text-xs">Viewer</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Button variant="ghost" disabled className={compact ? "w-auto" : "w-full justify-start"}>
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Loading...
      </Button>
    );
  }

  const currentOrg = organizations.find((org) => org.id === currentOrgId) || organizations[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`${compact ? "w-auto" : "w-full justify-between"} hover:bg-cyber-surface-light`}
          disabled={isSwitching}
        >
          <div className="flex items-center gap-2 truncate">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyber-primary to-cyber-secondary flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            {!compact && (
              <div className="text-left truncate">
                <p className="text-sm font-medium truncate">{currentOrg?.name || "Select Org"}</p>
                <p className="text-xs text-cyber-text-muted truncate">{currentOrg?.industry}</p>
              </div>
            )}
          </div>
          {isSwitching ? (
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 shrink-0" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Your Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => switchOrganization(org)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyber-surface-light flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-cyber-text-muted" />
                </div>
                <div>
                  <p className="text-sm font-medium">{org.name}</p>
                  <p className="text-xs text-cyber-text-muted">{org.industry}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getRoleBadge(org.role)}
                {org.id === currentOrgId && (
                  <Check className="w-4 h-4 text-cyber-success" />
                )}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={createNewOrganization} className="cursor-pointer">
          <Plus className="w-4 h-4 mr-2" />
          Create New Organization
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push("/dashboard/settings")}
          className="cursor-pointer"
        >
          <Settings className="w-4 h-4 mr-2" />
          Organization Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
