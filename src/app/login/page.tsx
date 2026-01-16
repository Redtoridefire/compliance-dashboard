"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  // Check for existing valid session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const sessionStr = localStorage.getItem("cybercomply_session");
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          const userId = session.userId || session.user_id;
          const organizationId = session.organizationId || session.organization_id;
          const sessionToken = session.sessionToken || session.session_token;

          // If session has required fields, validate it
          if (userId && organizationId && sessionToken) {
            try {
              const response = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "validate",
                  sessionToken: sessionToken,
                }),
              });
              const data = await response.json();

              if (data.valid) {
                // Valid session exists, redirect to dashboard
                const redirect = searchParams.get("redirect") || "/dashboard";
                router.replace(redirect);
                return;
              }
            } catch {
              // Validation failed, continue to clear session
            }
          }
          // Invalid or incomplete session, clear it
          localStorage.removeItem("cybercomply_session");
        }
      } catch {
        // Error parsing session, clear it
        localStorage.removeItem("cybercomply_session");
      }
      setCheckingSession(false);
    };

    checkExistingSession();
  }, [router, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setIsLoading(false);
        return;
      }

      localStorage.setItem("cybercomply_session", JSON.stringify(data.session));
      const redirect = searchParams.get("redirect") || "/dashboard";
      router.push(redirect);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  // Show loading while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-cyber-bg cyber-grid flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="w-8 h-8 animate-spin text-cyber-primary mx-auto mb-2" />
          <p className="text-cyber-text-muted">Checking session...</p>
        </div>
      </div>
    );
  }

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

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
            </div>

            {error && (
              <p className="text-sm text-cyber-danger">{error}</p>
            )}

            <div className="flex justify-end">
              <a
                href="/forgot-password"
                className="text-sm text-cyber-primary hover:underline"
              >
                Forgot password?
              </a>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-cyber-text-muted mt-6">
            Don&apos;t have an account?{" "}
            <a href="/onboarding" className="text-cyber-primary hover:underline">
              Get Started
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cyber-bg flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyber-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
