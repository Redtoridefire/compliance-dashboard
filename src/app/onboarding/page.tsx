"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  Building2,
  User,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { INDUSTRIES, COMPANY_SIZES, GEOGRAPHIES } from "@/lib/utils";

interface Framework {
  id: string;
  name: string;
  abbreviation: string;
  category: string;
  description: string;
  applicable_industries: string[];
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialIndustry = searchParams.get("industry") || "";

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: "",
    industry: initialIndustry,
    subIndustry: "",
    companySize: "",
    geography: [] as string[],
    userName: "",
    userEmail: "",
    password: "",
    confirmPassword: "",
    selectedFrameworks: [] as string[],
  });

  useEffect(() => {
    fetchFrameworks();
  }, []);

  const fetchFrameworks = async () => {
    try {
      const response = await fetch("/api/frameworks");
      const data = await response.json();
      setFrameworks(data.frameworks || []);
    } catch (error) {
      console.error("Error fetching frameworks:", error);
    }
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleGeography = (geo: string) => {
    setFormData((prev) => ({
      ...prev,
      geography: prev.geography.includes(geo)
        ? prev.geography.filter((g) => g !== geo)
        : [...prev.geography, geo],
    }));
  };

  const toggleFramework = (frameworkId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedFrameworks: prev.selectedFrameworks.includes(frameworkId)
        ? prev.selectedFrameworks.filter((f) => f !== frameworkId)
        : [...prev.selectedFrameworks, frameworkId],
    }));
  };

  const getRecommendedFrameworks = () => {
    // If no industry selected yet, show all frameworks
    if (!formData.industry) {
      return frameworks;
    }

    // Filter frameworks by industry with null safety
    const filtered = frameworks.filter((f) => {
      const industries = f.applicable_industries || [];
      return industries.includes(formData.industry) ||
             industries.includes("other") ||
             industries.length === 0; // Include frameworks with no industry restrictions
    });

    // If no frameworks match the filter, return all frameworks
    return filtered.length > 0 ? filtered : frameworks;
  };

  const handleSubmit = async () => {
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          organizationName: formData.organizationName,
          industry: formData.industry,
          subIndustry: formData.subIndustry,
          companySize: formData.companySize,
          geography: formData.geography,
          userName: formData.userName,
          userEmail: formData.userEmail,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        setIsLoading(false);
        return;
      }

      // Store session
      localStorage.setItem("cybercomply_session", JSON.stringify(data.session));

      // Select frameworks
      for (const frameworkId of formData.selectedFrameworks) {
        await fetch("/api/frameworks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId: data.session.organizationId,
            frameworkId,
            action: "select",
          }),
        });
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("Error during onboarding:", error);
      alert("An error occurred. Please try again.");
    }
    setIsLoading(false);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.organizationName && formData.industry && formData.companySize;
      case 2:
        return (
          formData.userName &&
          formData.userEmail &&
          formData.password.length >= 8 &&
          formData.password === formData.confirmPassword
        );
      case 3:
        return formData.selectedFrameworks.length > 0;
      default:
        return false;
    }
  };

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-cyber-bg cyber-grid py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-cyber-text">CyberComply</span>
          </div>
          <h1 className="text-2xl font-bold text-cyber-text mb-2">
            Set Up Your Organization
          </h1>
          <p className="text-cyber-text-muted">
            Step {step} of {totalSteps}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step 1: Organization Info */}
        {step === 1 && (
          <Card className="border-cyber-border bg-cyber-surface">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyber-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-cyber-primary" />
                </div>
                <div>
                  <CardTitle>Organization Details</CardTitle>
                  <CardDescription>Tell us about your company</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  placeholder="Acme Financial Corp"
                  value={formData.organizationName}
                  onChange={(e) => handleInputChange("organizationName", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Industry</Label>
                <div className="grid grid-cols-2 gap-2">
                  {INDUSTRIES.slice(0, 6).map((industry) => (
                    <Button
                      key={industry.id}
                      variant={formData.industry === industry.id ? "default" : "outline"}
                      className="justify-start h-auto py-3"
                      onClick={() => handleInputChange("industry", industry.id)}
                    >
                      {industry.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Company Size</Label>
                <div className="grid grid-cols-2 gap-2">
                  {COMPANY_SIZES.map((size) => (
                    <Button
                      key={size.id}
                      variant={formData.companySize === size.id ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => handleInputChange("companySize", size.id)}
                    >
                      {size.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Geography (select all that apply)</Label>
                <div className="flex flex-wrap gap-2">
                  {GEOGRAPHIES.map((geo) => (
                    <Badge
                      key={geo.id}
                      variant={formData.geography.includes(geo.id) ? "default" : "outline"}
                      className="cursor-pointer px-3 py-1.5"
                      onClick={() => toggleGeography(geo.id)}
                    >
                      {geo.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: User Account */}
        {step === 2 && (
          <Card className="border-cyber-border bg-cyber-surface">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyber-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-cyber-primary" />
                </div>
                <div>
                  <CardTitle>Your Account</CardTitle>
                  <CardDescription>Create your admin account</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="userName">Your Name</Label>
                <Input
                  id="userName"
                  placeholder="John Smith"
                  value={formData.userName}
                  onChange={(e) => handleInputChange("userName", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userEmail">Email Address</Label>
                <Input
                  id="userEmail"
                  type="email"
                  placeholder="john@acme.com"
                  value={formData.userEmail}
                  onChange={(e) => handleInputChange("userEmail", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-text-muted hover:text-cyber-text"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {formData.password && formData.password.length < 8 && (
                  <p className="text-xs text-cyber-warning">Password must be at least 8 characters</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                />
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-cyber-danger">Passwords do not match</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Framework Selection */}
        {step === 3 && (
          <Card className="border-cyber-border bg-cyber-surface">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyber-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-cyber-primary" />
                </div>
                <div>
                  <CardTitle>Select Frameworks</CardTitle>
                  <CardDescription>
                    Choose compliance frameworks for your organization
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-cyber-text-muted">
                Based on your industry ({INDUSTRIES.find((i) => i.id === formData.industry)?.label || "selected"}),
                we recommend these frameworks:
              </p>

              {frameworks.length === 0 ? (
                <div className="p-4 rounded-lg border border-cyber-border bg-cyber-bg text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-cyber-primary" />
                  <p className="text-sm text-cyber-text-muted">Loading frameworks...</p>
                </div>
              ) : getRecommendedFrameworks().length === 0 ? (
                <div className="p-4 rounded-lg border border-cyber-border bg-cyber-bg text-center">
                  <p className="text-sm text-cyber-text-muted">No frameworks found for your industry. Showing all available frameworks.</p>
                </div>
              ) : null}

              <div className="space-y-3">
                {getRecommendedFrameworks().map((framework) => {
                  const isSelected = formData.selectedFrameworks.includes(framework.id);
                  return (
                    <div
                      key={framework.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? "border-cyber-primary bg-cyber-primary/10"
                          : "border-cyber-border hover:border-cyber-primary/50"
                      }`}
                      onClick={() => toggleFramework(framework.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-cyber-text">
                              {framework.abbreviation}
                            </h3>
                            <Badge variant="muted" className="text-xs">
                              {framework.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-cyber-text-muted">
                            {framework.name}
                          </p>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? "border-cyber-primary bg-cyber-primary"
                              : "border-cyber-border"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {formData.selectedFrameworks.length > 0 && (
                <div className="bg-cyber-bg rounded-lg p-4 border border-cyber-border">
                  <p className="text-sm text-cyber-text">
                    <strong>{formData.selectedFrameworks.length}</strong> framework
                    {formData.selectedFrameworks.length !== 1 ? "s" : ""} selected.
                    You can add more later from the Frameworks page.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => (step === 1 ? router.push("/") : setStep(step - 1))}
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {step < totalSteps ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canProceed() || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Complete Setup
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cyber-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyber-primary" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
