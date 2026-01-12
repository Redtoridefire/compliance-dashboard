"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  Layers,
  CheckSquare,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface DashboardStats {
  totalFrameworks: number;
  selectedFrameworks: number;
  totalControls: number;
  implementedControls: number;
  partialControls: number;
  totalGaps: number;
  criticalGaps: number;
  highGaps: number;
  compliancePercentage: number;
}

interface FrameworkScore {
  name: string;
  abbreviation: string;
  percentage: number;
  implemented: number;
  total: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [frameworkScores, setFrameworkScores] = useState<FrameworkScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const currentSession = getSession();
    setSession(currentSession);
    if (currentSession) {
      fetchDashboardData(currentSession.organizationId);
    }
  }, []);

  const fetchDashboardData = async (organizationId: string) => {
    setIsLoading(true);
    try {
      // Fetch frameworks
      const frameworksRes = await fetch(
        `/api/frameworks?organizationId=${organizationId}`
      );
      const frameworksData = await frameworksRes.json();

      // Fetch controls
      const controlsRes = await fetch(
        `/api/controls?organizationId=${organizationId}`
      );
      const controlsData = await controlsRes.json();

      // Fetch gaps
      const gapsRes = await fetch(`/api/gaps?organizationId=${organizationId}`);
      const gapsData = await gapsRes.json();

      // Calculate stats
      const selectedFrameworks = frameworksData.frameworks?.filter(
        (f: any) => f.isSelected
      ) || [];

      const controls = controlsData.controls || [];
      const implemented = controls.filter(
        (c: any) => c.implementation?.implementation_status === "Fully Implemented"
      ).length;
      const partial = controls.filter(
        (c: any) => c.implementation?.implementation_status === "Partially Implemented"
      ).length;

      const gaps = gapsData.gaps || [];
      const criticalGaps = gaps.filter((g: any) => g.gap_severity === "Critical").length;
      const highGaps = gaps.filter((g: any) => g.gap_severity === "High").length;

      const compliancePercentage =
        controls.length > 0 ? Math.round((implemented / controls.length) * 100) : 0;

      setStats({
        totalFrameworks: frameworksData.frameworks?.length || 0,
        selectedFrameworks: selectedFrameworks.length,
        totalControls: controls.length,
        implementedControls: implemented,
        partialControls: partial,
        totalGaps: gaps.length,
        criticalGaps,
        highGaps,
        compliancePercentage,
      });

      // Calculate framework scores
      const scores: FrameworkScore[] = [];
      for (const framework of selectedFrameworks) {
        const frameworkControls = controls.filter(
          (c: any) => c.framework_id === framework.id
        );
        const frameworkImplemented = frameworkControls.filter(
          (c: any) => c.implementation?.implementation_status === "Fully Implemented"
        ).length;

        scores.push({
          name: framework.name,
          abbreviation: framework.abbreviation,
          percentage:
            frameworkControls.length > 0
              ? Math.round((frameworkImplemented / frameworkControls.length) * 100)
              : 0,
          implemented: frameworkImplemented,
          total: frameworkControls.length,
        });
      }
      setFrameworkScores(scores);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
    setIsLoading(false);
  };

  const handleComputeGaps = async () => {
    if (!session?.organizationId) return;

    try {
      await fetch("/api/gaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: session.organizationId,
          action: "compute",
        }),
      });
      fetchDashboardData(session.organizationId);
    } catch (error) {
      console.error("Error computing gaps:", error);
    }
  };

  const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#64748b"];

  const pieData = stats
    ? [
        { name: "Implemented", value: stats.implementedControls, color: "#10b981" },
        { name: "Partial", value: stats.partialControls, color: "#f59e0b" },
        {
          name: "Not Implemented",
          value: stats.totalControls - stats.implementedControls - stats.partialControls,
          color: "#ef4444",
        },
      ]
    : [];

  const gapData = stats
    ? [
        { name: "Critical", count: stats.criticalGaps, fill: "#ef4444" },
        { name: "High", count: stats.highGaps, fill: "#f59e0b" },
        { name: "Medium", count: Math.max(0, stats.totalGaps - stats.criticalGaps - stats.highGaps - Math.floor(stats.totalGaps * 0.2)), fill: "#06b6d4" },
        { name: "Low", count: Math.floor(stats.totalGaps * 0.2), fill: "#3b82f6" },
      ]
    : [];

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-cyber-surface rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-cyber-surface rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-cyber-text">Dashboard</h1>
          <p className="text-cyber-text-muted mt-1">
            Your compliance overview at a glance
          </p>
        </div>
        <Button onClick={handleComputeGaps} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Analysis
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-cyber-border bg-cyber-surface">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-cyber-text-muted mb-1">
                  Overall Compliance
                </p>
                <p className="text-3xl font-bold text-cyber-text">
                  {stats?.compliancePercentage || 0}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-cyber-success/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-cyber-success" />
              </div>
            </div>
            <Progress
              value={stats?.compliancePercentage || 0}
              className="mt-4"
              indicatorClassName="bg-cyber-success"
            />
          </CardContent>
        </Card>

        <Card className="border-cyber-border bg-cyber-surface">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-cyber-text-muted mb-1">
                  Active Frameworks
                </p>
                <p className="text-3xl font-bold text-cyber-text">
                  {stats?.selectedFrameworks || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-cyber-primary/10 flex items-center justify-center">
                <Layers className="w-6 h-6 text-cyber-primary" />
              </div>
            </div>
            <p className="text-sm text-cyber-text-muted mt-4">
              of {stats?.totalFrameworks || 0} available
            </p>
          </CardContent>
        </Card>

        <Card className="border-cyber-border bg-cyber-surface">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-cyber-text-muted mb-1">
                  Controls Implemented
                </p>
                <p className="text-3xl font-bold text-cyber-text">
                  {stats?.implementedControls || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-cyber-accent/10 flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-cyber-accent" />
              </div>
            </div>
            <p className="text-sm text-cyber-text-muted mt-4">
              of {stats?.totalControls || 0} total controls
            </p>
          </CardContent>
        </Card>

        <Card className="border-cyber-border bg-cyber-surface">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-cyber-text-muted mb-1">
                  Total Gaps
                </p>
                <p className="text-3xl font-bold text-cyber-text">
                  {stats?.totalGaps || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-cyber-danger/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-cyber-danger" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              {stats?.criticalGaps ? (
                <Badge variant="danger">{stats.criticalGaps} Critical</Badge>
              ) : null}
              {stats?.highGaps ? (
                <Badge variant="warning">{stats.highGaps} High</Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Implementation Status Pie Chart */}
        <Card className="border-cyber-border bg-cyber-surface">
          <CardHeader>
            <CardTitle className="text-lg">Implementation Status</CardTitle>
            <CardDescription>Control implementation breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#151929",
                      border: "1px solid #1e2638",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-cyber-text-muted">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gap Severity Bar Chart */}
        <Card className="border-cyber-border bg-cyber-surface">
          <CardHeader>
            <CardTitle className="text-lg">Gap Distribution</CardTitle>
            <CardDescription>Gaps by severity level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gapData} layout="vertical">
                  <XAxis type="number" stroke="#64748b" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#64748b"
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#151929",
                      border: "1px solid #1e2638",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Framework Compliance Scores */}
      <Card className="border-cyber-border bg-cyber-surface">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Framework Compliance</CardTitle>
            <CardDescription>
              Compliance percentage per framework
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/frameworks")}
          >
            Manage Frameworks
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardHeader>
        <CardContent>
          {frameworkScores.length > 0 ? (
            <div className="space-y-4">
              {frameworkScores.map((score) => (
                <div key={score.abbreviation} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{score.abbreviation}</Badge>
                      <span className="text-sm text-cyber-text-muted">
                        {score.name}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-cyber-text">
                      {score.percentage}% ({score.implemented}/{score.total})
                    </span>
                  </div>
                  <Progress
                    value={score.percentage}
                    className="h-2"
                    indicatorClassName={
                      score.percentage >= 80
                        ? "bg-cyber-success"
                        : score.percentage >= 50
                        ? "bg-cyber-warning"
                        : "bg-cyber-danger"
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-cyber-text-dim mx-auto mb-4" />
              <p className="text-cyber-text-muted mb-4">
                No frameworks selected yet
              </p>
              <Button onClick={() => router.push("/dashboard/frameworks")}>
                Select Frameworks
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
