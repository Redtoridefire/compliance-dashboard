"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, Shield } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "user" | "viewer";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionStr = localStorage.getItem("cybercomply_session");

        if (!sessionStr) {
          // No session, redirect to login
          router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }

        const session = JSON.parse(sessionStr);

        // Validate session has required fields
        if (!session.user_id || !session.organization_id) {
          localStorage.removeItem("cybercomply_session");
          router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }

        // Check role-based access if required
        if (requiredRole) {
          const roleHierarchy: Record<string, number> = {
            viewer: 1,
            user: 2,
            admin: 3,
          };

          const userRoleLevel = roleHierarchy[session.role] || 0;
          const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

          if (userRoleLevel < requiredRoleLevel) {
            // Insufficient permissions
            router.push("/dashboard?error=unauthorized");
            return;
          }
        }

        // Optionally validate session with server
        try {
          const response = await fetch("/api/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "validate",
              session_token: session.session_token,
            }),
          });

          const data = await response.json();

          if (data.error || !data.valid) {
            // Invalid session, clear and redirect
            localStorage.removeItem("cybercomply_session");
            router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
            return;
          }
        } catch {
          // If validation fails due to network, allow access with existing session
          // This enables offline-first behavior
          console.warn("Session validation failed, using cached session");
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname, requiredRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cyber-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="w-8 h-8 animate-spin text-cyber-primary mx-auto mb-2" />
          <p className="text-cyber-text-muted">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Router will handle redirect
  }

  return <>{children}</>;
}

// HOC version for easier use
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: "admin" | "user" | "viewer"
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute requiredRole={requiredRole}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
