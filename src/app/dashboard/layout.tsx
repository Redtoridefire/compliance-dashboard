"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Shield,
  LayoutDashboard,
  Layers,
  CheckSquare,
  GitBranch,
  AlertTriangle,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  FileDown,
} from "lucide-react";
import { getSession, clearSession } from "@/lib/auth";
import { getInitials } from "@/lib/utils";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { OrgSwitcher } from "@/components/auth/OrgSwitcher";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Frameworks", href: "/dashboard/frameworks", icon: Layers },
  { name: "Controls", href: "/dashboard/controls", icon: CheckSquare },
  { name: "Mapping", href: "/dashboard/mapping", icon: GitBranch },
  { name: "Gap Analysis", href: "/dashboard/gaps", icon: AlertTriangle },
  { name: "AI Assistant", href: "/dashboard/chat", icon: MessageSquare },
  { name: "Exports", href: "/dashboard/exports", icon: FileDown },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const currentSession = getSession();
    if (!currentSession) {
      // Check for demo mode
      const params = new URLSearchParams(window.location.search);
      if (params.get("demo") === "true") {
        // Create a demo session
        const demoSession = {
          userId: "demo",
          organizationId: "demo",
          email: "demo@cybercomply.io",
          name: "Demo User",
          role: "admin",
          sessionToken: "demo",
        };
        localStorage.setItem("cybercomply_session", JSON.stringify(demoSession));
        setSession(demoSession);
      } else {
        router.push("/login");
      }
    } else {
      setSession(currentSession);
    }
  }, [router]);

  const handleLogout = () => {
    clearSession();
    router.push("/");
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-cyber-bg flex items-center justify-center">
        <div className="animate-pulse">
          <Shield className="w-12 h-12 text-cyber-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-bg">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-cyber-surface border-r border-cyber-border transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 p-6 border-b border-cyber-border">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-cyber-text">CyberComply</span>
          </div>

          {/* Organization Switcher */}
          <div className="px-4 py-3 border-b border-cyber-border">
            <OrgSwitcher
              currentOrgId={session?.organization_id || session?.organizationId}
              currentOrgName={session?.organization_name || "My Organization"}
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-cyber-primary/10 text-cyber-primary"
                      : "text-cyber-text-muted hover:bg-cyber-bg hover:text-cyber-text"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-cyber-border">
            <div className="flex items-center gap-3 mb-4">
              <Avatar>
                <AvatarFallback className="bg-cyber-primary text-white">
                  {getInitials(session.name || session.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-cyber-text truncate">
                  {session.name || "User"}
                </p>
                <p className="text-xs text-cyber-text-muted truncate">
                  {session.email}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="min-h-screen p-6">
          <ProtectedRoute>{children}</ProtectedRoute>
        </div>
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
