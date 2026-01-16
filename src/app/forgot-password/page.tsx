"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, ArrowLeft, Mail, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [debugToken, setDebugToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Get the current base URL for the reset link
      const baseUrl = window.location.origin;

      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_password_reset",
          email,
          baseUrl
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(true);
        setEmailSent(data.emailSent || false);
        // For testing in development mode
        if (data.debug?.resetToken) {
          setDebugToken(data.debug.resetToken);
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
    setIsLoading(false);
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
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Enter your email address and we&apos;ll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              {emailSent ? (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/50 text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-green-400 font-medium">Check Your Email</p>
                  <p className="text-sm text-cyber-text-muted mt-1">
                    We&apos;ve sent a password reset link to {email}. The link will expire in 1 hour.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/50 text-center">
                  <AlertCircle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-yellow-400 font-medium">Request Received</p>
                  <p className="text-sm text-cyber-text-muted mt-1">
                    If an account exists with {email}, a reset link would be sent. However, email delivery is not currently configured.
                  </p>
                </div>
              )}

              {/* Show contact info if email not sent */}
              {!emailSent && !debugToken && (
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/50">
                  <p className="text-sm text-blue-400">
                    <strong>Need help?</strong> Please contact your system administrator for password reset assistance.
                  </p>
                </div>
              )}

              {/* Debug info - only shown in development mode when API returns token */}
              {debugToken && (
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/50">
                  <p className="text-xs text-yellow-400 font-mono break-all">
                    <strong>Development Mode:</strong><br />
                    {debugToken}
                  </p>
                  <a
                    href={`/reset-password?token=${debugToken}`}
                    className="text-sm text-cyber-primary hover:underline mt-2 block"
                  >
                    Click here to reset password
                  </a>
                </div>
              )}

              <a href="/login" className="block">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-text-dim" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-cyber-danger">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                Send Reset Link
              </Button>

              <a href="/login" className="block">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </a>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
