"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  Filter,
  CheckCircle2,
  Circle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { groupBy } from "@/lib/utils";

interface Control {
  id: string;
  control_id: string;
  title: string;
  description: string;
  control_family: string;
  priority: string;
  implementation_guidance: string;
  framework: {
    id: string;
    name: string;
    abbreviation: string;
  };
  implementation?: {
    implementation_status: string;
    implementation_notes: string;
  };
}

export default function ControlsPage() {
  const [controls, setControls] = useState<Control[]>([]);
  const [controlFamilies, setControlFamilies] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [familyFilter, setFamilyFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set());
  const [selectedControl, setSelectedControl] = useState<Control | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [implementationNotes, setImplementationNotes] = useState("");

  useEffect(() => {
    const currentSession = getSession();
    setSession(currentSession);
    if (currentSession) {
      fetchControls(currentSession.organizationId);
    }
  }, []);

  const fetchControls = async (organizationId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/controls?organizationId=${organizationId}`);
      const data = await response.json();
      setControls(data.controls || []);
      setControlFamilies(data.controlFamilies || []);
      // Expand first family by default
      if (data.controlFamilies?.length > 0) {
        setExpandedFamilies(new Set([data.controlFamilies[0]]));
      }
    } catch (error) {
      console.error("Error fetching controls:", error);
    }
    setIsLoading(false);
  };

  const updateImplementation = async (controlId: string, controlNumber: string, status: string) => {
    if (!session?.organizationId) return;

    setIsSaving(true);
    try {
      await fetch("/api/implementations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: session.organizationId,
          controlId,
          controlNumber, // Human-readable control ID like "500.02(a)"
          implementationStatus: status,
          implementationNotes,
        }),
      });
      fetchControls(session.organizationId);
      setSelectedControl(null);
      setImplementationNotes("");
    } catch (error) {
      console.error("Error updating implementation:", error);
    }
    setIsSaving(false);
  };

  const toggleFamily = (family: string) => {
    const newExpanded = new Set(expandedFamilies);
    if (newExpanded.has(family)) {
      newExpanded.delete(family);
    } else {
      newExpanded.add(family);
    }
    setExpandedFamilies(newExpanded);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "Fully Implemented":
        return <CheckCircle2 className="w-5 h-5 text-cyber-success" />;
      case "Partially Implemented":
        return <AlertCircle className="w-5 h-5 text-cyber-warning" />;
      default:
        return <Circle className="w-5 h-5 text-cyber-text-dim" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "danger" | "warning" | "info" | "primary"> = {
      Critical: "danger",
      High: "warning",
      Medium: "info",
      Low: "primary",
    };
    return <Badge variant={variants[priority] || "muted"}>{priority}</Badge>;
  };

  const filteredControls = controls.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.control_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFamily = !familyFilter || c.control_family === familyFilter;
    const matchesStatus =
      !statusFilter ||
      (statusFilter === "not_implemented" && !c.implementation) ||
      (statusFilter === "partially" && c.implementation?.implementation_status === "Partially Implemented") ||
      (statusFilter === "implemented" && c.implementation?.implementation_status === "Fully Implemented");
    return matchesSearch && matchesFamily && matchesStatus;
  });

  const groupedControls = groupBy(filteredControls, "control_family");

  const stats = {
    total: controls.length,
    implemented: controls.filter((c) => c.implementation?.implementation_status === "Fully Implemented").length,
    partial: controls.filter((c) => c.implementation?.implementation_status === "Partially Implemented").length,
    notImplemented: controls.filter((c) => !c.implementation).length,
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-cyber-surface rounded w-1/4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-cyber-surface rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-cyber-text">Controls</h1>
          <p className="text-cyber-text-muted mt-1">
            Manage your control implementations
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="border-cyber-border bg-cyber-surface">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-cyber-text">{stats.total}</p>
            <p className="text-sm text-cyber-text-muted">Total</p>
          </CardContent>
        </Card>
        <Card className="border-cyber-border bg-cyber-surface">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-cyber-success">{stats.implemented}</p>
            <p className="text-sm text-cyber-text-muted">Implemented</p>
          </CardContent>
        </Card>
        <Card className="border-cyber-border bg-cyber-surface">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-cyber-warning">{stats.partial}</p>
            <p className="text-sm text-cyber-text-muted">Partial</p>
          </CardContent>
        </Card>
        <Card className="border-cyber-border bg-cyber-surface">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-cyber-danger">{stats.notImplemented}</p>
            <p className="text-sm text-cyber-text-muted">Not Implemented</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-text-dim" />
          <Input
            placeholder="Search controls..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 bg-cyber-bg border border-cyber-border rounded-lg text-cyber-text"
          value={statusFilter || ""}
          onChange={(e) => setStatusFilter(e.target.value || null)}
        >
          <option value="">All Statuses</option>
          <option value="implemented">Implemented</option>
          <option value="partially">Partially Implemented</option>
          <option value="not_implemented">Not Implemented</option>
        </select>
      </div>

      {/* Controls by Family */}
      <div className="space-y-4">
        {Object.entries(groupedControls).map(([family, familyControls]) => (
          <Card key={family} className="border-cyber-border bg-cyber-surface">
            <CardHeader
              className="cursor-pointer"
              onClick={() => toggleFamily(family)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{family}</CardTitle>
                  <Badge variant="muted">{familyControls.length} controls</Badge>
                </div>
                {expandedFamilies.has(family) ? (
                  <ChevronUp className="w-5 h-5 text-cyber-text-muted" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-cyber-text-muted" />
                )}
              </div>
            </CardHeader>
            {expandedFamilies.has(family) && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {familyControls.map((control) => (
                    <div
                      key={control.id}
                      className="flex items-center justify-between p-4 bg-cyber-bg rounded-lg border border-cyber-border hover:border-cyber-primary/50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedControl(control);
                        setImplementationNotes(control.implementation?.implementation_notes || "");
                      }}
                    >
                      <div className="flex items-center gap-4">
                        {getStatusIcon(control.implementation?.implementation_status)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-cyber-text">
                              {control.control_id}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {control.framework.abbreviation}
                            </Badge>
                            {getPriorityBadge(control.priority)}
                          </div>
                          <p className="text-sm text-cyber-text-muted line-clamp-1">
                            {control.title}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Control Detail Dialog */}
      <Dialog open={!!selectedControl} onOpenChange={() => setSelectedControl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedControl?.control_id}
              <Badge variant="outline">{selectedControl?.framework.abbreviation}</Badge>
            </DialogTitle>
            <DialogDescription>{selectedControl?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-cyber-text-muted">Description</Label>
              <p className="text-sm text-cyber-text mt-1">{selectedControl?.description}</p>
            </div>
            {selectedControl?.implementation_guidance && (
              <div>
                <Label className="text-cyber-text-muted">Implementation Guidance</Label>
                <p className="text-sm text-cyber-text mt-1">{selectedControl?.implementation_guidance}</p>
              </div>
            )}
            <div>
              <Label>Implementation Notes</Label>
              <Textarea
                placeholder="Add notes about your implementation..."
                value={implementationNotes}
                onChange={(e) => setImplementationNotes(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedControl?.implementation?.implementation_status === "Fully Implemented" ? "default" : "outline"}
                onClick={() => selectedControl && updateImplementation(selectedControl.id, selectedControl.control_id, "Fully Implemented")}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Fully Implemented
              </Button>
              <Button
                variant={selectedControl?.implementation?.implementation_status === "Partially Implemented" ? "default" : "outline"}
                onClick={() => selectedControl && updateImplementation(selectedControl.id, selectedControl.control_id, "Partially Implemented")}
                disabled={isSaving}
                className="flex-1"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Partially
              </Button>
              <Button
                variant="outline"
                onClick={() => selectedControl && updateImplementation(selectedControl.id, selectedControl.control_id, "Not Implemented")}
                disabled={isSaving}
                className="flex-1"
              >
                <Circle className="w-4 h-4 mr-2" />
                Not Implemented
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
