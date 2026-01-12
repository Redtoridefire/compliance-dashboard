"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Plus, Search, ExternalLink, Loader2 } from "lucide-react";
import { getSession } from "@/lib/auth";

interface Framework {
  id: string;
  name: string;
  abbreviation: string;
  category: string;
  description: string;
  version: string;
  applicable_industries: string[];
  documentation_url: string;
  isSelected?: boolean;
  complianceStatus?: string;
}

export default function FrameworksPage() {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingFramework, setLoadingFramework] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const currentSession = getSession();
    setSession(currentSession);
    if (currentSession) {
      fetchFrameworks(currentSession.organizationId);
    }
  }, []);

  const fetchFrameworks = async (organizationId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/frameworks?organizationId=${organizationId}`);
      const data = await response.json();
      setFrameworks(data.frameworks || []);
    } catch (error) {
      console.error("Error fetching frameworks:", error);
    }
    setIsLoading(false);
  };

  const toggleFramework = async (frameworkId: string, isSelected: boolean) => {
    if (!session?.organizationId) return;

    setLoadingFramework(frameworkId);
    try {
      await fetch("/api/frameworks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: session.organizationId,
          frameworkId,
          action: isSelected ? "unselect" : "select",
        }),
      });
      fetchFrameworks(session.organizationId);
    } catch (error) {
      console.error("Error toggling framework:", error);
    }
    setLoadingFramework(null);
  };

  const categories = ["all", ...new Set(frameworks.map((f) => f.category))];

  const filteredFrameworks = frameworks.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.abbreviation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || f.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const selectedFrameworks = frameworks.filter((f) => f.isSelected);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-cyber-surface rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-cyber-surface rounded-xl"></div>
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
          <h1 className="text-3xl font-bold text-cyber-text">Frameworks</h1>
          <p className="text-cyber-text-muted mt-1">
            Select compliance frameworks for your organization
          </p>
        </div>
        <Badge variant="info" className="text-base px-4 py-2">
          {selectedFrameworks.length} Selected
        </Badge>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-text-dim" />
          <Input
            placeholder="Search frameworks..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
          <TabsList>
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Frameworks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredFrameworks.map((framework) => (
          <Card
            key={framework.id}
            className={`border-cyber-border bg-cyber-surface transition-all ${
              framework.isSelected ? "border-cyber-primary" : ""
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg">{framework.abbreviation}</CardTitle>
                    <Badge variant="muted">{framework.category}</Badge>
                    {framework.version && (
                      <Badge variant="outline" className="text-xs">
                        v{framework.version}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-cyber-text-muted">
                    {framework.name}
                  </CardDescription>
                </div>
                {framework.isSelected && (
                  <CheckCircle2 className="w-6 h-6 text-cyber-success" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-cyber-text-muted mb-4 line-clamp-3">
                {framework.description}
              </p>
              <div className="flex items-center justify-between">
                <Button
                  variant={framework.isSelected ? "outline" : "default"}
                  size="sm"
                  onClick={() => toggleFramework(framework.id, framework.isSelected || false)}
                  disabled={loadingFramework === framework.id}
                >
                  {loadingFramework === framework.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : framework.isSelected ? (
                    <>Remove</>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </>
                  )}
                </Button>
                {framework.documentation_url && (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={framework.documentation_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Docs
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFrameworks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-cyber-text-muted">No frameworks found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
