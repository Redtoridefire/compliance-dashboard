"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileJson,
  FileSpreadsheet,
  FileText,
  Download,
  Loader2,
  CheckCircle2,
  FileDown,
  Clock,
  Shield,
  Layers,
  AlertTriangle,
  GitBranch,
} from "lucide-react";

interface ExportOptions {
  includeFrameworks: boolean;
  includeControls: boolean;
  includeImplementations: boolean;
  includeGaps: boolean;
  includeMappings: boolean;
  includeRecommendations: boolean;
}

interface ExportHistory {
  id: string;
  type: string;
  format: string;
  timestamp: Date;
  size: string;
}

export default function ExportsPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<"json" | "csv" | "pdf">("pdf");
  const [options, setOptions] = useState<ExportOptions>({
    includeFrameworks: true,
    includeControls: true,
    includeImplementations: true,
    includeGaps: true,
    includeMappings: true,
    includeRecommendations: true,
  });
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([]);

  useEffect(() => {
    // Load export history from localStorage
    const historyStr = localStorage.getItem("cybercomply_export_history");
    if (historyStr) {
      const history = JSON.parse(historyStr);
      setExportHistory(history.map((h: ExportHistory) => ({
        ...h,
        timestamp: new Date(h.timestamp)
      })));
    }
  }, []);

  const addToHistory = (type: string, format: string, size: string) => {
    const newEntry: ExportHistory = {
      id: Date.now().toString(),
      type,
      format,
      timestamp: new Date(),
      size,
    };
    const newHistory = [newEntry, ...exportHistory].slice(0, 10);
    setExportHistory(newHistory);
    localStorage.setItem("cybercomply_export_history", JSON.stringify(newHistory));
  };

  const fetchAllData = async () => {
    const [frameworksRes, controlsRes, gapsRes, mappingsRes] = await Promise.all([
      fetch("/api/frameworks"),
      fetch("/api/controls"),
      fetch("/api/gaps"),
      fetch("/api/mappings"),
    ]);

    return {
      frameworks: (await frameworksRes.json()).frameworks || [],
      controls: (await controlsRes.json()).controls || [],
      gaps: (await gapsRes.json()).gaps || [],
      mappings: (await mappingsRes.json()).mappings || [],
    };
  };

  const generatePDF = async () => {
    setIsExporting(true);
    setExportProgress(10);

    try {
      // Dynamic import for jspdf
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      setExportProgress(20);
      const data = await fetchAllData();
      setExportProgress(40);

      // Get session info
      const sessionStr = localStorage.getItem("cybercomply_session");
      const session = sessionStr ? JSON.parse(sessionStr) : {};

      // Create PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title Page
      doc.setFillColor(10, 14, 26);
      doc.rect(0, 0, pageWidth, 297, "F");

      doc.setTextColor(59, 130, 246);
      doc.setFontSize(32);
      doc.text("CyberComply", pageWidth / 2, 60, { align: "center" });

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text("Compliance Report", pageWidth / 2, 80, { align: "center" });

      doc.setFontSize(14);
      doc.setTextColor(156, 163, 175);
      doc.text(session.organization_name || "Organization", pageWidth / 2, 100, { align: "center" });
      doc.text(new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      }), pageWidth / 2, 110, { align: "center" });

      setExportProgress(50);

      // Executive Summary Page
      doc.addPage();
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, 297, "F");

      doc.setTextColor(31, 41, 55);
      doc.setFontSize(20);
      doc.text("Executive Summary", 20, 30);

      doc.setFontSize(12);
      doc.setTextColor(75, 85, 99);

      const selectedFrameworks = data.frameworks.filter((f: { is_selected?: boolean }) => f.is_selected);
      const implementedControls = data.controls.filter((c: { implementation_status?: string }) =>
        c.implementation_status === "fully_implemented"
      ).length;
      const totalControls = data.controls.length;
      const complianceRate = totalControls > 0
        ? Math.round((implementedControls / totalControls) * 100)
        : 0;

      const summaryText = [
        `Organization: ${session.organization_name || "N/A"}`,
        `Industry: ${session.industry || "Financial Services"}`,
        `Report Generated: ${new Date().toLocaleString()}`,
        "",
        "Compliance Overview:",
        `• Active Frameworks: ${selectedFrameworks.length}`,
        `• Total Controls: ${totalControls}`,
        `• Implemented Controls: ${implementedControls}`,
        `• Compliance Rate: ${complianceRate}%`,
        `• Identified Gaps: ${data.gaps.length}`,
        `• Control Mappings: ${data.mappings.length}`,
      ];

      let yPos = 45;
      summaryText.forEach(line => {
        doc.text(line, 20, yPos);
        yPos += 8;
      });

      setExportProgress(60);

      // Frameworks Page
      if (options.includeFrameworks && data.frameworks.length > 0) {
        doc.addPage();
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(20);
        doc.text("Compliance Frameworks", 20, 30);

        autoTable(doc, {
          startY: 40,
          head: [["Framework", "Version", "Category", "Status"]],
          body: data.frameworks.map((f: {
            name: string;
            version?: string;
            category?: string;
            is_selected?: boolean;
          }) => [
            f.name,
            f.version || "N/A",
            f.category || "General",
            f.is_selected ? "Active" : "Inactive"
          ]),
          theme: "striped",
          headStyles: { fillColor: [59, 130, 246] },
        });
      }

      setExportProgress(70);

      // Controls Page
      if (options.includeControls && data.controls.length > 0) {
        doc.addPage();
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(20);
        doc.text("Control Inventory", 20, 30);

        const controlsForTable = data.controls.slice(0, 50);
        autoTable(doc, {
          startY: 40,
          head: [["Control ID", "Title", "Family", "Status"]],
          body: controlsForTable.map((c: {
            control_id: string;
            title: string;
            control_family?: string;
            implementation_status?: string;
          }) => [
            c.control_id,
            c.title.substring(0, 40) + (c.title.length > 40 ? "..." : ""),
            c.control_family || "N/A",
            (c.implementation_status || "not_started").replace(/_/g, " ")
          ]),
          theme: "striped",
          headStyles: { fillColor: [59, 130, 246] },
          styles: { fontSize: 8 },
        });

        if (data.controls.length > 50) {
          doc.setFontSize(10);
          doc.setTextColor(107, 114, 128);
          doc.text(
            `Showing 50 of ${data.controls.length} controls. Export CSV for complete list.`,
            20,
            doc.internal.pageSize.getHeight() - 20
          );
        }
      }

      setExportProgress(80);

      // Gap Analysis Page
      if (options.includeGaps && data.gaps.length > 0) {
        doc.addPage();
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(20);
        doc.text("Gap Analysis", 20, 30);

        const gapsForTable = data.gaps.slice(0, 30);
        autoTable(doc, {
          startY: 40,
          head: [["Control", "Severity", "Frameworks", "Status"]],
          body: gapsForTable.map((g: {
            control_id?: string;
            gap_severity?: string;
            gap_frameworks?: string[];
            status?: string;
          }) => [
            g.control_id || "N/A",
            g.gap_severity || "Medium",
            (g.gap_frameworks || []).length.toString() + " frameworks",
            g.status || "Open"
          ]),
          theme: "striped",
          headStyles: { fillColor: [239, 68, 68] },
        });
      }

      setExportProgress(90);

      // Save the PDF
      const fileName = `cybercomply-report-${Date.now()}.pdf`;
      doc.save(fileName);

      setExportProgress(100);
      setExportSuccess("PDF report generated successfully!");
      addToHistory("Full Report", "PDF", `${Math.round(doc.internal.pages.length * 50)}KB`);

      setTimeout(() => {
        setExportSuccess(null);
        setExportProgress(0);
      }, 3000);

    } catch (error) {
      console.error("PDF generation error:", error);
      setExportSuccess("Error generating PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const generateCSV = async () => {
    setIsExporting(true);
    setExportProgress(20);

    try {
      const data = await fetchAllData();
      setExportProgress(50);

      let csvContent = "";

      // Controls CSV
      if (options.includeControls) {
        csvContent += "CONTROLS\n";
        csvContent += "Control ID,Title,Framework,Family,Priority,Status\n";
        data.controls.forEach((c: {
          control_id: string;
          title: string;
          framework_id?: string;
          control_family?: string;
          priority?: string;
          implementation_status?: string;
        }) => {
          csvContent += `"${c.control_id}","${c.title.replace(/"/g, '""')}","${c.framework_id || ''}","${c.control_family || ''}","${c.priority || ''}","${c.implementation_status || 'not_started'}"\n`;
        });
        csvContent += "\n";
      }

      // Gaps CSV
      if (options.includeGaps) {
        csvContent += "GAPS\n";
        csvContent += "Control ID,Severity,Gap Frameworks,Status\n";
        data.gaps.forEach((g: {
          control_id?: string;
          gap_severity?: string;
          gap_frameworks?: string[];
          status?: string;
        }) => {
          csvContent += `"${g.control_id || ''}","${g.gap_severity || ''}","${(g.gap_frameworks || []).join('; ')}","${g.status || 'Open'}"\n`;
        });
        csvContent += "\n";
      }

      // Mappings CSV
      if (options.includeMappings) {
        csvContent += "MAPPINGS\n";
        csvContent += "Source Control,Target Control,Mapping Type,Confidence\n";
        data.mappings.forEach((m: {
          source_control_id?: string;
          target_control_id?: string;
          mapping_type?: string;
          confidence_score?: number;
        }) => {
          csvContent += `"${m.source_control_id || ''}","${m.target_control_id || ''}","${m.mapping_type || ''}","${m.confidence_score || 0}"\n`;
        });
      }

      setExportProgress(80);

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cybercomply-export-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportProgress(100);
      setExportSuccess("CSV export completed!");
      addToHistory("Data Export", "CSV", `${Math.round(csvContent.length / 1024)}KB`);

      setTimeout(() => {
        setExportSuccess(null);
        setExportProgress(0);
      }, 3000);

    } catch (error) {
      console.error("CSV export error:", error);
      setExportSuccess("Error exporting CSV. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const generateJSON = async () => {
    setIsExporting(true);
    setExportProgress(20);

    try {
      const data = await fetchAllData();
      setExportProgress(50);

      const sessionStr = localStorage.getItem("cybercomply_session");
      const session = sessionStr ? JSON.parse(sessionStr) : {};

      const exportData: Record<string, unknown> = {
        metadata: {
          organization: session.organization_name,
          exportDate: new Date().toISOString(),
          version: "1.0",
        },
      };

      if (options.includeFrameworks) exportData.frameworks = data.frameworks;
      if (options.includeControls) exportData.controls = data.controls;
      if (options.includeGaps) exportData.gaps = data.gaps;
      if (options.includeMappings) exportData.mappings = data.mappings;

      setExportProgress(80);

      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cybercomply-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportProgress(100);
      setExportSuccess("JSON export completed!");
      addToHistory("Data Export", "JSON", `${Math.round(jsonStr.length / 1024)}KB`);

      setTimeout(() => {
        setExportSuccess(null);
        setExportProgress(0);
      }, 3000);

    } catch (error) {
      console.error("JSON export error:", error);
      setExportSuccess("Error exporting JSON. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = () => {
    switch (selectedFormat) {
      case "pdf":
        generatePDF();
        break;
      case "csv":
        generateCSV();
        break;
      case "json":
        generateJSON();
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Export & Reports</h1>
        <p className="text-cyber-text-muted mt-1">
          Generate compliance reports and export your data in various formats
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Export Configuration */}
        <div className="col-span-2 space-y-6">
          {/* Format Selection */}
          <Card className="border-cyber-border bg-cyber-surface">
            <CardHeader>
              <CardTitle>Export Format</CardTitle>
              <CardDescription>Choose your preferred export format</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setSelectedFormat("pdf")}
                  className={`p-6 rounded-lg border transition-all text-left ${
                    selectedFormat === "pdf"
                      ? "border-cyber-primary bg-cyber-primary/10"
                      : "border-cyber-border bg-cyber-bg hover:border-cyber-primary/50"
                  }`}
                >
                  <FileText className={`w-8 h-8 mb-3 ${
                    selectedFormat === "pdf" ? "text-cyber-primary" : "text-cyber-text-muted"
                  }`} />
                  <p className="font-semibold">PDF Report</p>
                  <p className="text-sm text-cyber-text-muted mt-1">
                    Formatted compliance report with charts
                  </p>
                  <Badge className="mt-3 bg-cyber-success/20 text-cyber-success">
                    Recommended
                  </Badge>
                </button>

                <button
                  onClick={() => setSelectedFormat("csv")}
                  className={`p-6 rounded-lg border transition-all text-left ${
                    selectedFormat === "csv"
                      ? "border-cyber-success bg-cyber-success/10"
                      : "border-cyber-border bg-cyber-bg hover:border-cyber-success/50"
                  }`}
                >
                  <FileSpreadsheet className={`w-8 h-8 mb-3 ${
                    selectedFormat === "csv" ? "text-cyber-success" : "text-cyber-text-muted"
                  }`} />
                  <p className="font-semibold">CSV Export</p>
                  <p className="text-sm text-cyber-text-muted mt-1">
                    Spreadsheet-compatible data export
                  </p>
                  <Badge variant="outline" className="mt-3">Excel Compatible</Badge>
                </button>

                <button
                  onClick={() => setSelectedFormat("json")}
                  className={`p-6 rounded-lg border transition-all text-left ${
                    selectedFormat === "json"
                      ? "border-cyber-warning bg-cyber-warning/10"
                      : "border-cyber-border bg-cyber-bg hover:border-cyber-warning/50"
                  }`}
                >
                  <FileJson className={`w-8 h-8 mb-3 ${
                    selectedFormat === "json" ? "text-cyber-warning" : "text-cyber-text-muted"
                  }`} />
                  <p className="font-semibold">JSON Export</p>
                  <p className="text-sm text-cyber-text-muted mt-1">
                    Full data export for developers
                  </p>
                  <Badge variant="outline" className="mt-3">API Compatible</Badge>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card className="border-cyber-border bg-cyber-surface">
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
              <CardDescription>Select what data to include in your export</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-cyber-border">
                  <Checkbox
                    id="frameworks"
                    checked={options.includeFrameworks}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, includeFrameworks: !!checked })
                    }
                  />
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyber-primary" />
                    <Label htmlFor="frameworks">Frameworks</Label>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border border-cyber-border">
                  <Checkbox
                    id="controls"
                    checked={options.includeControls}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, includeControls: !!checked })
                    }
                  />
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyber-success" />
                    <Label htmlFor="controls">Controls</Label>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border border-cyber-border">
                  <Checkbox
                    id="implementations"
                    checked={options.includeImplementations}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, includeImplementations: !!checked })
                    }
                  />
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyber-secondary" />
                    <Label htmlFor="implementations">Implementation Status</Label>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border border-cyber-border">
                  <Checkbox
                    id="gaps"
                    checked={options.includeGaps}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, includeGaps: !!checked })
                    }
                  />
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-cyber-danger" />
                    <Label htmlFor="gaps">Gap Analysis</Label>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border border-cyber-border">
                  <Checkbox
                    id="mappings"
                    checked={options.includeMappings}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, includeMappings: !!checked })
                    }
                  />
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-cyber-warning" />
                    <Label htmlFor="mappings">Control Mappings</Label>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border border-cyber-border">
                  <Checkbox
                    id="recommendations"
                    checked={options.includeRecommendations}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, includeRecommendations: !!checked })
                    }
                  />
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyber-accent" />
                    <Label htmlFor="recommendations">AI Recommendations</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Button */}
          <Card className="border-cyber-border bg-cyber-surface">
            <CardContent className="p-6">
              {isExporting && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-cyber-text-muted">Generating export...</span>
                    <span className="text-sm font-medium">{exportProgress}%</span>
                  </div>
                  <Progress value={exportProgress} className="h-2" />
                </div>
              )}

              {exportSuccess && (
                <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                  exportSuccess.includes("Error")
                    ? "bg-cyber-danger/20 text-cyber-danger"
                    : "bg-cyber-success/20 text-cyber-success"
                }`}>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{exportSuccess}</span>
                </div>
              )}

              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full"
                size="lg"
              >
                {isExporting ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Download className="w-5 h-5 mr-2" />
                )}
                Export {selectedFormat.toUpperCase()}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Export History */}
        <div className="space-y-6">
          <Card className="border-cyber-border bg-cyber-surface">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Exports
              </CardTitle>
            </CardHeader>
            <CardContent>
              {exportHistory.length === 0 ? (
                <div className="text-center py-8">
                  <FileDown className="w-12 h-12 text-cyber-text-dim mx-auto mb-3" />
                  <p className="text-cyber-text-muted">No exports yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {exportHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border border-cyber-border bg-cyber-bg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {item.format === "PDF" && <FileText className="w-4 h-4 text-cyber-primary" />}
                          {item.format === "CSV" && <FileSpreadsheet className="w-4 h-4 text-cyber-success" />}
                          {item.format === "JSON" && <FileJson className="w-4 h-4 text-cyber-warning" />}
                          <span className="font-medium text-sm">{item.type}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">{item.format}</Badge>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-cyber-text-muted">
                        <span>{item.timestamp.toLocaleString()}</span>
                        <span>{item.size}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-cyber-border bg-cyber-surface">
            <CardHeader>
              <CardTitle>Quick Exports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setSelectedFormat("pdf");
                  setOptions({
                    includeFrameworks: true,
                    includeControls: true,
                    includeImplementations: true,
                    includeGaps: true,
                    includeMappings: false,
                    includeRecommendations: true,
                  });
                  setTimeout(handleExport, 100);
                }}
                disabled={isExporting}
              >
                <FileText className="w-4 h-4 mr-2" />
                Executive Summary (PDF)
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setSelectedFormat("csv");
                  setOptions({
                    includeFrameworks: false,
                    includeControls: true,
                    includeImplementations: true,
                    includeGaps: false,
                    includeMappings: false,
                    includeRecommendations: false,
                  });
                  setTimeout(generateCSV, 100);
                }}
                disabled={isExporting}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Control Inventory (CSV)
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setSelectedFormat("csv");
                  setOptions({
                    includeFrameworks: false,
                    includeControls: false,
                    includeImplementations: false,
                    includeGaps: true,
                    includeMappings: false,
                    includeRecommendations: false,
                  });
                  setTimeout(generateCSV, 100);
                }}
                disabled={isExporting}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Gap Analysis (CSV)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
