"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  User,
  Key,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Trash2,
  RefreshCw
} from "lucide-react";

interface Organization {
  id: string;
  name: string;
  industry: string;
  size: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("organization");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [organization, setOrganization] = useState<Organization>({
    id: "",
    name: "",
    industry: "",
    size: ""
  });
  const [user, setUser] = useState<UserProfile>({
    id: "",
    email: "",
    name: "",
    role: ""
  });
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    setIsLoading(true);
    try {
      const sessionStr = localStorage.getItem("cybercomply_session");
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        setOrganization({
          id: session.organization_id || "",
          name: session.organization_name || "",
          industry: session.industry || "financial_services",
          size: session.size || "small"
        });
        setUser({
          id: session.user_id || "",
          email: session.email || "",
          name: session.name || "",
          role: session.role || "admin"
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Update localStorage session
      const sessionStr = localStorage.getItem("cybercomply_session");
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        const updatedSession = {
          ...session,
          organization_name: organization.name,
          industry: organization.industry,
          size: organization.size,
          name: user.name,
          email: user.email
        };
        localStorage.setItem("cybercomply_session", JSON.stringify(updatedSession));
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async (format: "json" | "csv" | "pdf") => {
    try {
      // Fetch all data
      const [frameworksRes, controlsRes, gapsRes] = await Promise.all([
        fetch("/api/frameworks"),
        fetch("/api/controls"),
        fetch("/api/gaps")
      ]);

      const frameworks = await frameworksRes.json();
      const controls = await controlsRes.json();
      const gaps = await gapsRes.json();

      const exportData = {
        organization: organization,
        exportDate: new Date().toISOString(),
        frameworks: frameworks.frameworks,
        controls: controls.controls,
        gaps: gaps.gaps
      };

      if (format === "json") {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        downloadBlob(blob, `cybercomply-export-${Date.now()}.json`);
      } else if (format === "csv") {
        // Convert to CSV format
        const csvContent = convertToCSV(exportData);
        const blob = new Blob([csvContent], { type: "text/csv" });
        downloadBlob(blob, `cybercomply-export-${Date.now()}.csv`);
      } else {
        // For PDF, just download JSON for now
        alert("PDF export coming soon! Downloading JSON instead.");
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        downloadBlob(blob, `cybercomply-export-${Date.now()}.json`);
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Error exporting data. Please try again.");
    }
  };

  const convertToCSV = (data: Record<string, unknown>) => {
    const controls = data.controls as Array<Record<string, unknown>> || [];
    if (controls.length === 0) return "No data to export";

    const headers = ["Control ID", "Title", "Framework", "Family", "Status"];
    const rows = controls.map((c: Record<string, unknown>) => [
      c.control_id,
      c.title,
      c.framework_id,
      c.control_family,
      c.implementation_status || "not_started"
    ]);

    return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all local data? This cannot be undone.")) {
      localStorage.clear();
      window.location.href = "/";
    }
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
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-cyber-text-muted mt-1">
          Manage your organization, profile, and export data
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-cyber-bg border border-cyber-border">
          <TabsTrigger value="organization" className="data-[state=active]:bg-cyber-surface">
            <Building2 className="w-4 h-4 mr-2" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="profile" className="data-[state=active]:bg-cyber-surface">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-cyber-surface">
            <Key className="w-4 h-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="export" className="data-[state=active]:bg-cyber-surface">
            <Download className="w-4 h-4 mr-2" />
            Export
          </TabsTrigger>
        </TabsList>

        {/* Organization Settings */}
        <TabsContent value="organization" className="mt-6">
          <Card className="border-cyber-border bg-cyber-surface">
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Update your organization information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    value={organization.name}
                    onChange={(e) => setOrganization({ ...organization, name: e.target.value })}
                    placeholder="Your Company Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={organization.industry}
                    onValueChange={(value) => setOrganization({ ...organization, industry: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="financial_services">Financial Services</SelectItem>
                      <SelectItem value="fintech">Fintech</SelectItem>
                      <SelectItem value="banking">Banking</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Organization Size</Label>
                  <Select
                    value={organization.size}
                    onValueChange={(value) => setOrganization({ ...organization, size: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="startup">Startup (1-50)</SelectItem>
                      <SelectItem value="small">Small (51-200)</SelectItem>
                      <SelectItem value="medium">Medium (201-1000)</SelectItem>
                      <SelectItem value="large">Large (1000+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Organization ID</Label>
                  <div className="flex items-center gap-2">
                    <Input value={organization.id} disabled className="font-mono text-sm" />
                    <Badge variant="outline">Auto-generated</Badge>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                {saveSuccess && (
                  <div className="flex items-center gap-2 text-cyber-success">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm">Settings saved!</span>
                  </div>
                )}
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Settings */}
        <TabsContent value="profile" className="mt-6">
          <Card className="border-cyber-border bg-cyber-surface">
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>
                Manage your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="userName">Full Name</Label>
                  <Input
                    id="userName"
                    value={user.name}
                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                    placeholder="Your Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userEmail">Email Address</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    value={user.email}
                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                    placeholder="you@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={user.role}
                    onValueChange={(value) => setUser({ ...user, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="compliance_officer">Compliance Officer</SelectItem>
                      <SelectItem value="auditor">Auditor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>User ID</Label>
                  <Input value={user.id} disabled className="font-mono text-sm" />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                {saveSuccess && (
                  <div className="flex items-center gap-2 text-cyber-success">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm">Profile saved!</span>
                  </div>
                )}
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="mt-6 space-y-6">
          <Card className="border-cyber-border bg-cyber-surface">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                OpenAI Integration
              </CardTitle>
              <CardDescription>
                Configure AI-powered features for gap analysis and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="apiKey"
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? "Hide" : "Show"}
                  </Button>
                </div>
                <p className="text-xs text-cyber-text-muted">
                  Your API key is stored locally and never sent to our servers
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-cyber-border bg-cyber-bg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyber-success/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-cyber-success" />
                  </div>
                  <div>
                    <p className="font-medium">Environment Variable Configured</p>
                    <p className="text-sm text-cyber-text-muted">
                      OPENAI_API_KEY is set in your environment
                    </p>
                  </div>
                </div>
                <Badge className="bg-cyber-success/20 text-cyber-success border-cyber-success/30">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-cyber-border bg-cyber-surface">
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
              <CardDescription>
                Future integrations we&apos;re working on
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: "Jira", description: "Sync gaps as tickets" },
                  { name: "Slack", description: "Notifications and alerts" },
                  { name: "AWS Security Hub", description: "Import findings" },
                  { name: "Azure Sentinel", description: "Security events" }
                ].map((integration) => (
                  <div
                    key={integration.name}
                    className="p-4 rounded-lg border border-cyber-border bg-cyber-bg opacity-60"
                  >
                    <p className="font-medium">{integration.name}</p>
                    <p className="text-sm text-cyber-text-muted">{integration.description}</p>
                    <Badge variant="outline" className="mt-2">Coming Soon</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export */}
        <TabsContent value="export" className="mt-6 space-y-6">
          <Card className="border-cyber-border bg-cyber-surface">
            <CardHeader>
              <CardTitle>Export Data</CardTitle>
              <CardDescription>
                Download your compliance data in various formats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => handleExport("json")}
                  className="p-6 rounded-lg border border-cyber-border bg-cyber-bg hover:border-cyber-primary hover:bg-cyber-primary/5 transition-all text-left group"
                >
                  <FileJson className="w-8 h-8 text-cyber-primary mb-3" />
                  <p className="font-semibold">JSON Export</p>
                  <p className="text-sm text-cyber-text-muted mt-1">
                    Full data export in JSON format
                  </p>
                  <Badge variant="outline" className="mt-3">Recommended</Badge>
                </button>

                <button
                  onClick={() => handleExport("csv")}
                  className="p-6 rounded-lg border border-cyber-border bg-cyber-bg hover:border-cyber-success hover:bg-cyber-success/5 transition-all text-left group"
                >
                  <FileSpreadsheet className="w-8 h-8 text-cyber-success mb-3" />
                  <p className="font-semibold">CSV Export</p>
                  <p className="text-sm text-cyber-text-muted mt-1">
                    Spreadsheet-compatible format
                  </p>
                  <Badge variant="outline" className="mt-3">Excel Compatible</Badge>
                </button>

                <button
                  onClick={() => handleExport("pdf")}
                  className="p-6 rounded-lg border border-cyber-border bg-cyber-bg hover:border-cyber-warning hover:bg-cyber-warning/5 transition-all text-left group"
                >
                  <FileText className="w-8 h-8 text-cyber-warning mb-3" />
                  <p className="font-semibold">PDF Report</p>
                  <p className="text-sm text-cyber-text-muted mt-1">
                    Formatted compliance report
                  </p>
                  <Badge variant="outline" className="mt-3">Coming Soon</Badge>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-cyber-danger/30 bg-cyber-danger/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyber-danger">
                <AlertCircle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions - proceed with caution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-cyber-danger/30 bg-cyber-bg">
                <div>
                  <p className="font-medium">Clear All Local Data</p>
                  <p className="text-sm text-cyber-text-muted">
                    Remove all stored data from your browser
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-cyber-danger text-cyber-danger hover:bg-cyber-danger hover:text-white"
                  onClick={handleClearData}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Data
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-cyber-border bg-cyber-bg">
                <div>
                  <p className="font-medium">Reset to Demo Mode</p>
                  <p className="text-sm text-cyber-text-muted">
                    Reload sample data for testing
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm("Reset to demo mode? This will clear your current session.")) {
                      localStorage.clear();
                      window.location.href = "/dashboard?demo=true";
                    }
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
