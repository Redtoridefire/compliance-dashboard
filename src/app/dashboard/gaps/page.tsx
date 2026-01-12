"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Search,
  RefreshCw,
  Bot,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { getSession } from "@/lib/auth";

interface Gap {
  id: string;
  gap_severity: string;
  estimated_effort: string;
  ai_recommendation?: string;
  control: {
    id: string;
    control_id: string;
    title: string;
    description: string;
    priority: string;
    control_family: string;
    framework: {
      name: string;
      abbreviation: string;
    };
  };
}

interface GapSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export default function GapsPage() {
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [summary, setSummary] = useState<GapSummary>({ critical: 0, high: 0, medium: 0, low: 0, total: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [selectedGap, setSelectedGap] = useState<Gap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isComputing, setIsComputing] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const currentSession = getSession();
    setSession(currentSession);
    if (currentSession) {
      fetchGaps(currentSession.organizationId);
    }
  }, []);

  const fetchGaps = async (organizationId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/gaps?organizationId=${organizationId}`);
      const data = await response.json();
      setGaps(data.gaps || []);
      setSummary(data.summary || { critical: 0, high: 0, medium: 0, low: 0, total: 0 });
    } catch (error) {
      console.error("Error fetching gaps:", error);
    }
    setIsLoading(false);
  };

  const computeGaps = async () => {
    if (!session?.organizationId) return;
    setIsComputing(true);
    try {
      await fetch("/api/gaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: session.organizationId,
          action: "compute",
        }),
      });
      fetchGaps(session.organizationId);
    } catch (error) {
      console.error("Error computing gaps:", error);
    }
    setIsComputing(false);
  };

  const getAIRecommendation = async (gap: Gap) => {
    if (!session?.organizationId) return;
    setIsLoadingAI(true);
    setAiRecommendation(null);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "gap_recommendation",
          organizationId: session.organizationId,
          controlId: gap.control.id,
        }),
      });
      const data = await response.json();
      if (data.error) {
        setAiRecommendation(`Error: ${data.error}`);
      } else {
        setAiRecommendation(data.recommendation);
      }
    } catch (error) {
      setAiRecommendation("Failed to get AI recommendation. Please try again.");
    }
    setIsLoadingAI(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "danger";
      case "High": return "warning";
      case "Medium": return "info";
      case "Low": return "primary";
      default: return "muted";
    }
  };

  const filteredGaps = gaps.filter((g) => {
    const matchesSearch =
      g.control.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.control.control_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = !severityFilter || g.gap_severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-cyber-surface rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
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
          <h1 className="text-3xl font-bold text-cyber-text">Gap Analysis</h1>
          <p className="text-cyber-text-muted mt-1">
            Identify and remediate compliance gaps
          </p>
        </div>
        <Button onClick={computeGaps} disabled={isComputing}>
          {isComputing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Recompute Gaps
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <Card className="border-cyber-border bg-cyber-surface">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-cyber-text">{summary.total}</p>
            <p className="text-sm text-cyber-text-muted">Total Gaps</p>
          </CardContent>
        </Card>
        <Card
          className={`border-cyber-border bg-cyber-surface cursor-pointer transition-colors ${
            severityFilter === "Critical" ? "border-cyber-danger" : ""
          }`}
          onClick={() => setSeverityFilter(severityFilter === "Critical" ? null : "Critical")}
        >
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-cyber-danger">{summary.critical}</p>
            <p className="text-sm text-cyber-text-muted">Critical</p>
          </CardContent>
        </Card>
        <Card
          className={`border-cyber-border bg-cyber-surface cursor-pointer transition-colors ${
            severityFilter === "High" ? "border-cyber-warning" : ""
          }`}
          onClick={() => setSeverityFilter(severityFilter === "High" ? null : "High")}
        >
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-cyber-warning">{summary.high}</p>
            <p className="text-sm text-cyber-text-muted">High</p>
          </CardContent>
        </Card>
        <Card
          className={`border-cyber-border bg-cyber-surface cursor-pointer transition-colors ${
            severityFilter === "Medium" ? "border-cyber-accent" : ""
          }`}
          onClick={() => setSeverityFilter(severityFilter === "Medium" ? null : "Medium")}
        >
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-cyber-accent">{summary.medium}</p>
            <p className="text-sm text-cyber-text-muted">Medium</p>
          </CardContent>
        </Card>
        <Card
          className={`border-cyber-border bg-cyber-surface cursor-pointer transition-colors ${
            severityFilter === "Low" ? "border-cyber-primary" : ""
          }`}
          onClick={() => setSeverityFilter(severityFilter === "Low" ? null : "Low")}
        >
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-cyber-primary">{summary.low}</p>
            <p className="text-sm text-cyber-text-muted">Low</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-text-dim" />
        <Input
          placeholder="Search gaps..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Gaps List */}
      {filteredGaps.length > 0 ? (
        <div className="space-y-3">
          {filteredGaps.map((gap) => (
            <Card
              key={gap.id}
              className="border-cyber-border bg-cyber-surface hover:border-cyber-primary/50 cursor-pointer transition-colors"
              onClick={() => {
                setSelectedGap(gap);
                setAiRecommendation(gap.ai_recommendation || null);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-12 rounded-full bg-cyber-${getSeverityColor(gap.gap_severity) === 'danger' ? 'danger' : getSeverityColor(gap.gap_severity) === 'warning' ? 'warning' : getSeverityColor(gap.gap_severity) === 'info' ? 'accent' : 'primary'}`} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-cyber-text">
                          {gap.control.control_id}
                        </span>
                        <Badge variant="outline">{gap.control.framework.abbreviation}</Badge>
                        <Badge variant={getSeverityColor(gap.gap_severity) as any}>
                          {gap.gap_severity}
                        </Badge>
                        <Badge variant="muted">{gap.estimated_effort} Effort</Badge>
                      </div>
                      <p className="text-sm text-cyber-text-muted">{gap.control.title}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-cyber-text-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-cyber-border bg-cyber-surface">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 text-cyber-success mx-auto mb-4" />
            <p className="text-lg font-medium text-cyber-text mb-2">No Gaps Found</p>
            <p className="text-cyber-text-muted">
              {gaps.length === 0
                ? "Run gap analysis to identify compliance gaps."
                : "No gaps match your current filters."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Gap Detail Dialog */}
      <Dialog open={!!selectedGap} onOpenChange={() => setSelectedGap(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedGap?.control.control_id}
              <Badge variant="outline">{selectedGap?.control.framework.abbreviation}</Badge>
              <Badge variant={getSeverityColor(selectedGap?.gap_severity || "") as any}>
                {selectedGap?.gap_severity}
              </Badge>
            </DialogTitle>
            <DialogDescription>{selectedGap?.control.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-cyber-text-muted mb-1">Description</h4>
              <p className="text-sm text-cyber-text">{selectedGap?.control.description}</p>
            </div>
            <div className="flex gap-4">
              <div>
                <h4 className="text-sm font-medium text-cyber-text-muted mb-1">Control Family</h4>
                <Badge variant="muted">{selectedGap?.control.control_family}</Badge>
              </div>
              <div>
                <h4 className="text-sm font-medium text-cyber-text-muted mb-1">Priority</h4>
                <Badge variant={getSeverityColor(selectedGap?.control.priority || "") as any}>
                  {selectedGap?.control.priority}
                </Badge>
              </div>
              <div>
                <h4 className="text-sm font-medium text-cyber-text-muted mb-1">Estimated Effort</h4>
                <Badge variant="muted">{selectedGap?.estimated_effort}</Badge>
              </div>
            </div>

            {/* AI Recommendation Section */}
            <div className="border-t border-cyber-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-cyber-text flex items-center gap-2">
                  <Bot className="w-4 h-4 text-cyber-primary" />
                  AI Recommendation
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => selectedGap && getAIRecommendation(selectedGap)}
                  disabled={isLoadingAI}
                >
                  {isLoadingAI ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Bot className="w-4 h-4 mr-2" />
                  )}
                  Get AI Advice
                </Button>
              </div>
              {isLoadingAI ? (
                <div className="bg-cyber-bg rounded-lg p-4 border border-cyber-border">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-cyber-border rounded w-3/4"></div>
                    <div className="h-4 bg-cyber-border rounded w-1/2"></div>
                    <div className="h-4 bg-cyber-border rounded w-5/6"></div>
                  </div>
                </div>
              ) : aiRecommendation ? (
                <div className="bg-cyber-bg rounded-lg p-4 border border-cyber-border">
                  <p className="text-sm text-cyber-text whitespace-pre-wrap">{aiRecommendation}</p>
                </div>
              ) : (
                <div className="bg-cyber-bg rounded-lg p-4 border border-cyber-border text-center">
                  <p className="text-sm text-cyber-text-muted">
                    Click &quot;Get AI Advice&quot; for remediation recommendations
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
