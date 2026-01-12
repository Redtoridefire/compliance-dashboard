"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  CreditCard,
  Landmark,
  Shield,
  Heart,
  Cpu,
  ShoppingCart,
  Settings,
  Building,
  LayoutGrid,
  ArrowRight,
  CheckCircle2,
  Zap,
  GitBranch,
  Bot,
} from "lucide-react";

const industries = [
  { id: "financial_services", label: "Financial Services", icon: Building2, description: "Banks, investment firms, asset managers" },
  { id: "fintech", label: "Fintech", icon: CreditCard, description: "Payment processors, digital banking, crypto" },
  { id: "banking", label: "Banking", icon: Landmark, description: "Commercial & retail banks, credit unions" },
  { id: "insurance", label: "Insurance", icon: Shield, description: "Life, health, property & casualty insurers" },
  { id: "healthcare", label: "Healthcare", icon: Heart, description: "Hospitals, clinics, health tech" },
  { id: "technology", label: "Technology", icon: Cpu, description: "SaaS, software, cloud services" },
  { id: "retail", label: "Retail", icon: ShoppingCart, description: "E-commerce, POS, payment handling" },
  { id: "manufacturing", label: "Manufacturing", icon: Settings, description: "Industrial, supply chain, OT security" },
  { id: "government", label: "Government", icon: Building, description: "Federal, state, local agencies" },
  { id: "other", label: "Other", icon: LayoutGrid, description: "Other regulated industries" },
];

const features = [
  {
    icon: GitBranch,
    title: "Multi-Framework Mapping",
    description: "Map controls across NYDFS 500, ISO 27001, SOC 2, NIST CSF, PCI DSS, and more",
  },
  {
    icon: CheckCircle2,
    title: "Gap Analysis",
    description: "Identify where controls satisfy some frameworks but not others",
  },
  {
    icon: Bot,
    title: "AI-Powered Recommendations",
    description: "Get intelligent remediation guidance powered by GPT-4",
  },
  {
    icon: Zap,
    title: "Compliance Scoring",
    description: "Visual dashboards showing your compliance posture per framework",
  },
];

export default function Home() {
  const router = useRouter();
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);

  const handleGetStarted = () => {
    if (selectedIndustry) {
      router.push(`/onboarding?industry=${selectedIndustry}`);
    }
  };

  const handleDemoMode = () => {
    router.push("/dashboard?demo=true");
  };

  return (
    <div className="min-h-screen bg-cyber-bg cyber-grid">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyber-primary/5 via-transparent to-transparent" />

        <div className="container mx-auto px-4 py-16 relative">
          {/* Header */}
          <header className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-cyber-text">CyberComply</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push("/login")}>
                Sign In
              </Button>
              <Button variant="outline" onClick={handleDemoMode}>
                Try Demo
              </Button>
            </div>
          </header>

          {/* Hero Content */}
          <div className="max-w-4xl mx-auto text-center mb-16">
            <Badge variant="info" className="mb-4">
              Open Source Compliance Tool
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-cyber-text">
              Cybersecurity Control{" "}
              <span className="text-gradient-primary">Mapping & Gap Analysis</span>
            </h1>
            <p className="text-xl text-cyber-text-muted mb-8 max-w-2xl mx-auto">
              Map your security controls across multiple compliance frameworks, identify gaps,
              and get AI-powered remediation recommendations. Built for financial services.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {["NYDFS 500", "ISO 27001", "SOC 2", "NIST CSF", "PCI DSS", "GLBA"].map((framework) => (
                <Badge key={framework} variant="outline" className="px-4 py-1.5 text-sm">
                  {framework}
                </Badge>
              ))}
            </div>
          </div>

          {/* Industry Selector */}
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-semibold text-center mb-8 text-cyber-text">
              Select Your Industry to Get Started
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {industries.map((industry) => {
                const Icon = industry.icon;
                const isSelected = selectedIndustry === industry.id;

                return (
                  <Card
                    key={industry.id}
                    className={`cursor-pointer transition-all duration-300 card-hover ${
                      isSelected
                        ? "border-cyber-primary bg-cyber-primary/10 glow-primary"
                        : "border-cyber-border hover:border-cyber-primary/50"
                    }`}
                    onClick={() => setSelectedIndustry(industry.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <div
                        className={`w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-cyber-primary text-white"
                            : "bg-cyber-bg text-cyber-text-muted"
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-medium text-sm text-cyber-text mb-1">
                        {industry.label}
                      </h3>
                      <p className="text-xs text-cyber-text-dim line-clamp-2">
                        {industry.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-center gap-4">
              <Button
                size="lg"
                onClick={handleGetStarted}
                disabled={!selectedIndustry}
                className="min-w-[200px]"
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleDemoMode}
              >
                Explore Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-24 bg-cyber-surface/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-cyber-text">
              Enterprise-Grade Compliance, Open Source
            </h2>
            <p className="text-cyber-text-muted max-w-2xl mx-auto">
              Stop paying $100k+/year for GRC tools. Get the same capabilities with our
              open-source solution enhanced by AI.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-cyber-border bg-cyber-surface/50 card-hover">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-cyber-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-cyber-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2 text-cyber-text">
                      {feature.title}
                    </h3>
                    <p className="text-cyber-text-muted text-sm">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto glass rounded-2xl p-12">
            <h2 className="text-3xl font-bold mb-4 text-cyber-text">
              Ready to Simplify Your Compliance?
            </h2>
            <p className="text-cyber-text-muted mb-8">
              Join security teams who are mapping controls and closing gaps faster with CyberComply.
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" variant="glow" onClick={handleGetStarted}>
                Start Free
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="https://github.com/cybercomply/framework-mapper" target="_blank" rel="noopener noreferrer">
                  View on GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-cyber-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyber-primary" />
              <span className="font-semibold text-cyber-text">CyberComply</span>
            </div>
            <p className="text-sm text-cyber-text-muted">
              Open source under MIT License. Built for the security community.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
