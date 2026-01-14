"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!email || !email.trim()) {
      setError("Please enter your email address");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error || "Login failed. Please try again.");
        setIsLoading(false);
        return;
      }

      if (!data.session) {
        setError("Invalid response from server. Please try again.");
        setIsLoading(false);
        return;
      }

      localStorage.setItem("cybercomply_session", JSON.stringify(data.session));
      router.push("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred. Please check your connection and try again.");
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email: "demo@cybercomply.io" }),
      });

      const data = await response.json();

      if (data.error) {
        // If demo user doesn't exist, just redirect to demo mode
        router.push("/dashboard?demo=true");
        return;
      }

      localStorage.setItem("cybercomply_session", JSON.stringify(data.session));
      router.push("/dashboard");
    } catch (err) {
      router.push("/dashboard?demo=true");
    }
  };

  return (
    <div className="min-h-screen bg-cyber-bg cyber-grid flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-cyber-border bg-cyber-surface">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to your CyberComply account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-cyber-danger">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Sign In
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-cyber-border"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-cyber-surface px-2 text-cyber-text-muted">or</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleDemoLogin}
            disabled={isLoading}
          >
            Try Demo Mode
          </Button>

          <p className="text-center text-sm text-cyber-text-muted mt-6">
            Don&apos;t have an account?{" "}
            <a href="/onboarding" className="text-cyber-primary hover:underline">
              Sign Up
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
