"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  ArrowRightLeft,
  Filter,
  CheckCircle2,
  AlertCircle,
  Link2,
  Info,
  Loader2
} from "lucide-react";

interface Framework {
  id: string;
  name: string;
  short_name: string;
  version: string;
}

interface Control {
  id: string;
  control_id: string;
  title: string;
  description: string;
  framework_id: string;
  control_family: string;
}

interface Mapping {
  id: string;
  source_control_id: string;
  target_control_id: string;
  mapping_type: "equivalent" | "partial" | "related";
  confidence_score: number;
  notes?: string;
  source_control?: Control;
  target_control?: Control;
}

export default function MappingPage() {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sourceFramework, setSourceFramework] = useState<string>("");
  const [targetFramework, setTargetFramework] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [mappingTypeFilter, setMappingTypeFilter] = useState<string>("all");
  const [selectedMapping, setSelectedMapping] = useState<Mapping | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch frameworks
      const frameworksRes = await fetch("/api/frameworks");
      const frameworksData = await frameworksRes.json();
      setFrameworks(frameworksData.frameworks || []);

      // Fetch controls
      const controlsRes = await fetch("/api/controls");
      const controlsData = await controlsRes.json();
      setControls(controlsData.controls || []);

      // Fetch mappings
      const mappingsRes = await fetch("/api/mappings");
      const mappingsData = await mappingsRes.json();
      setMappings(mappingsData.mappings || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getControlById = (id: string) => controls.find(c => c.id === id);
  const getFrameworkById = (id: string) => frameworks.find(f => f.id === id);

  const filteredMappings = mappings.filter(mapping => {
    const sourceControl = getControlById(mapping.source_control_id);
    const targetControl = getControlById(mapping.target_control_id);

    // Framework filters
    if (sourceFramework && sourceControl?.framework_id !== sourceFramework) return false;
    if (targetFramework && targetControl?.framework_id !== targetFramework) return false;

    // Mapping type filter
    if (mappingTypeFilter !== "all" && mapping.mapping_type !== mappingTypeFilter) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSource =
        sourceControl?.control_id.toLowerCase().includes(query) ||
        sourceControl?.title.toLowerCase().includes(query);
      const matchesTarget =
        targetControl?.control_id.toLowerCase().includes(query) ||
        targetControl?.title.toLowerCase().includes(query);
      if (!matchesSource && !matchesTarget) return false;
    }

    return true;
  });

  const getMappingTypeBadge = (type: string) => {
    switch (type) {
      case "equivalent":
        return <Badge className="bg-cyber-success/20 text-cyber-success border-cyber-success/30">Equivalent</Badge>;
      case "partial":
        return <Badge className="bg-cyber-warning/20 text-cyber-warning border-cyber-warning/30">Partial</Badge>;
      case "related":
        return <Badge className="bg-cyber-primary/20 text-cyber-primary border-cyber-primary/30">Related</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.9) {
      return <Badge className="bg-cyber-success/20 text-cyber-success border-cyber-success/30">{Math.round(score * 100)}%</Badge>;
    } else if (score >= 0.7) {
      return <Badge className="bg-cyber-warning/20 text-cyber-warning border-cyber-warning/30">{Math.round(score * 100)}%</Badge>;
    } else {
      return <Badge className="bg-cyber-text-dim/20 text-cyber-text-muted border-cyber-text-dim/30">{Math.round(score * 100)}%</Badge>;
    }
  };

  // Calculate stats
  const stats = {
    total: mappings.length,
    equivalent: mappings.filter(m => m.mapping_type === "equivalent").length,
    partial: mappings.filter(m => m.mapping_type === "partial").length,
    related: mappings.filter(m => m.mapping_type === "related").length,
    avgConfidence: mappings.length > 0
      ? Math.round((mappings.reduce((sum, m) => sum + m.confidence_score, 0) / mappings.length) * 100)
      : 0
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyber-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Control Mapping Matrix</h1>
        <p className="text-cyber-text-muted mt-1">
          Explore how controls map across different compliance frameworks
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="border-cyber-border bg-cyber-surface">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyber-primary/20 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-cyber-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-cyber-text-muted">Total Mappings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-cyber-border bg-cyber-surface">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyber-success/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-cyber-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.equivalent}</p>
                <p className="text-xs text-cyber-text-muted">Equivalent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-cyber-border bg-cyber-surface">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyber-warning/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-cyber-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.partial}</p>
                <p className="text-xs text-cyber-text-muted">Partial</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-cyber-border bg-cyber-surface">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyber-primary/20 flex items-center justify-center">
                <ArrowRightLeft className="w-5 h-5 text-cyber-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.related}</p>
                <p className="text-xs text-cyber-text-muted">Related</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-cyber-border bg-cyber-surface">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyber-secondary/20 flex items-center justify-center">
                <Info className="w-5 h-5 text-cyber-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgConfidence}%</p>
                <p className="text-xs text-cyber-text-muted">Avg Confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-cyber-border bg-cyber-surface">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-text-muted" />
              <Input
                placeholder="Search by control ID or title..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={sourceFramework} onValueChange={setSourceFramework}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Source Framework" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {frameworks.map(fw => (
                  <SelectItem key={fw.id} value={fw.id}>{fw.short_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ArrowRightLeft className="w-4 h-4 text-cyber-text-muted" />
            <Select value={targetFramework} onValueChange={setTargetFramework}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Target Framework" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Targets</SelectItem>
                {frameworks.map(fw => (
                  <SelectItem key={fw.id} value={fw.id}>{fw.short_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={mappingTypeFilter} onValueChange={setMappingTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Mapping Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="equivalent">Equivalent</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="related">Related</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSourceFramework("");
                setTargetFramework("");
                setMappingTypeFilter("all");
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mapping Table */}
      <Card className="border-cyber-border bg-cyber-surface">
        <CardHeader>
          <CardTitle>Control Mappings</CardTitle>
          <CardDescription>
            Showing {filteredMappings.length} of {mappings.length} mappings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-cyber-border hover:bg-cyber-bg/50">
                <TableHead className="text-cyber-text-muted">Source Control</TableHead>
                <TableHead className="text-cyber-text-muted">Source Framework</TableHead>
                <TableHead className="text-cyber-text-muted text-center">Mapping</TableHead>
                <TableHead className="text-cyber-text-muted">Target Control</TableHead>
                <TableHead className="text-cyber-text-muted">Target Framework</TableHead>
                <TableHead className="text-cyber-text-muted text-center">Confidence</TableHead>
                <TableHead className="text-cyber-text-muted"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMappings.slice(0, 50).map(mapping => {
                const sourceControl = getControlById(mapping.source_control_id);
                const targetControl = getControlById(mapping.target_control_id);
                const sourceFramework = sourceControl ? getFrameworkById(sourceControl.framework_id) : null;
                const targetFrameworkObj = targetControl ? getFrameworkById(targetControl.framework_id) : null;

                return (
                  <TableRow
                    key={mapping.id}
                    className="border-cyber-border hover:bg-cyber-bg/50 cursor-pointer"
                    onClick={() => setSelectedMapping(mapping)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-mono text-cyber-primary text-sm">
                          {sourceControl?.control_id}
                        </p>
                        <p className="text-xs text-cyber-text-muted truncate max-w-[200px]">
                          {sourceControl?.title}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {sourceFramework?.short_name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {getMappingTypeBadge(mapping.mapping_type)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-mono text-cyber-secondary text-sm">
                          {targetControl?.control_id}
                        </p>
                        <p className="text-xs text-cyber-text-muted truncate max-w-[200px]">
                          {targetControl?.title}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {targetFrameworkObj?.short_name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {getConfidenceBadge(mapping.confidence_score)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Info className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filteredMappings.length > 50 && (
            <p className="text-center text-sm text-cyber-text-muted mt-4">
              Showing first 50 results. Use filters to narrow down.
            </p>
          )}
          {filteredMappings.length === 0 && (
            <div className="text-center py-12">
              <ArrowRightLeft className="w-12 h-12 text-cyber-text-dim mx-auto mb-4" />
              <p className="text-cyber-text-muted">No mappings found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mapping Detail Dialog */}
      <Dialog open={!!selectedMapping} onOpenChange={() => setSelectedMapping(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mapping Details</DialogTitle>
          </DialogHeader>
          {selectedMapping && (() => {
            const sourceControl = getControlById(selectedMapping.source_control_id);
            const targetControl = getControlById(selectedMapping.target_control_id);
            const sourceFrameworkObj = sourceControl ? getFrameworkById(sourceControl.framework_id) : null;
            const targetFrameworkObj = targetControl ? getFrameworkById(targetControl.framework_id) : null;

            return (
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-4">
                  {getMappingTypeBadge(selectedMapping.mapping_type)}
                  {getConfidenceBadge(selectedMapping.confidence_score)}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <Card className="border-cyber-primary/30 bg-cyber-primary/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-cyber-text-muted">Source Control</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="outline" className="mb-2">{sourceFrameworkObj?.short_name}</Badge>
                      <p className="font-mono text-cyber-primary font-semibold">
                        {sourceControl?.control_id}
                      </p>
                      <p className="font-medium mt-1">{sourceControl?.title}</p>
                      <p className="text-sm text-cyber-text-muted mt-2">
                        {sourceControl?.description}
                      </p>
                      <Badge variant="outline" className="mt-3">
                        {sourceControl?.control_family}
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card className="border-cyber-secondary/30 bg-cyber-secondary/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-cyber-text-muted">Target Control</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="outline" className="mb-2">{targetFrameworkObj?.short_name}</Badge>
                      <p className="font-mono text-cyber-secondary font-semibold">
                        {targetControl?.control_id}
                      </p>
                      <p className="font-medium mt-1">{targetControl?.title}</p>
                      <p className="text-sm text-cyber-text-muted mt-2">
                        {targetControl?.description}
                      </p>
                      <Badge variant="outline" className="mt-3">
                        {targetControl?.control_family}
                      </Badge>
                    </CardContent>
                  </Card>
                </div>

                {selectedMapping.notes && (
                  <Card className="border-cyber-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-cyber-text-muted">Mapping Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{selectedMapping.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
