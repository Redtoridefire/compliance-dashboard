import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

export function calculatePercentage(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (result, item) => {
      const groupKey = String(item[key]);
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    },
    {} as Record<string, T[]>
  );
}

export const INDUSTRIES = [
  { id: "financial_services", label: "Financial Services", icon: "building-library" },
  { id: "fintech", label: "Fintech", icon: "credit-card" },
  { id: "banking", label: "Banking", icon: "banknotes" },
  { id: "insurance", label: "Insurance", icon: "shield-check" },
  { id: "healthcare", label: "Healthcare", icon: "heart" },
  { id: "technology", label: "Technology", icon: "cpu-chip" },
  { id: "retail", label: "Retail", icon: "shopping-cart" },
  { id: "manufacturing", label: "Manufacturing", icon: "cog" },
  { id: "government", label: "Government", icon: "building-office" },
  { id: "other", label: "Other", icon: "squares-2x2" },
] as const;

export const COMPANY_SIZES = [
  { id: "1-50", label: "1-50 employees" },
  { id: "51-200", label: "51-200 employees" },
  { id: "201-1000", label: "201-1,000 employees" },
  { id: "1000+", label: "1,000+ employees" },
] as const;

export const GEOGRAPHIES = [
  { id: "united_states", label: "United States" },
  { id: "new_york", label: "New York (NYDFS)" },
  { id: "california", label: "California (CCPA)" },
  { id: "european_union", label: "European Union (GDPR)" },
  { id: "united_kingdom", label: "United Kingdom" },
  { id: "canada", label: "Canada" },
  { id: "australia", label: "Australia" },
  { id: "singapore", label: "Singapore" },
  { id: "global", label: "Global Operations" },
] as const;

export const COMPLIANCE_STATUSES = [
  { id: "not_started", label: "Not Started", color: "text-cyber-text-dim" },
  { id: "in_progress", label: "In Progress", color: "text-cyber-warning" },
  { id: "compliant", label: "Compliant", color: "text-cyber-success" },
  { id: "under_review", label: "Under Review", color: "text-cyber-accent" },
] as const;

export const IMPLEMENTATION_STATUSES = [
  { id: "not_implemented", label: "Not Implemented", color: "danger" },
  { id: "partially_implemented", label: "Partially Implemented", color: "warning" },
  { id: "fully_implemented", label: "Fully Implemented", color: "success" },
] as const;

export const GAP_SEVERITIES = [
  { id: "critical", label: "Critical", color: "danger" },
  { id: "high", label: "High", color: "warning" },
  { id: "medium", label: "Medium", color: "info" },
  { id: "low", label: "Low", color: "primary" },
] as const;

export const PRIORITIES = [
  { id: "critical", label: "Critical", color: "danger" },
  { id: "high", label: "High", color: "warning" },
  { id: "medium", label: "Medium", color: "info" },
  { id: "low", label: "Low", color: "primary" },
] as const;
