"use client";

import { supabase } from "./supabase";
import { generateSessionToken } from "./utils";
import type { Session, User, Organization } from "@/types";

const SESSION_KEY = "cybercomply_session";

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;

  try {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (!sessionData) return null;
    return JSON.parse(sessionData) as Session;
  } catch {
    return null;
  }
}

export function setSession(session: Session): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

export interface CreateAccountInput {
  organizationName: string;
  industry: string;
  subIndustry?: string;
  companySize: string;
  geography: string[];
  userName: string;
  userEmail: string;
}

export async function createAccount(input: CreateAccountInput): Promise<{
  success: boolean;
  session?: Session;
  error?: string;
}> {
  try {
    // Create organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: input.organizationName,
        industry: input.industry,
        sub_industry: input.subIndustry,
        company_size: input.companySize,
        geography: input.geography,
      })
      .select()
      .single();

    if (orgError || !org) {
      console.error("Error creating organization:", orgError);
      return { success: false, error: "Failed to create organization" };
    }

    // Generate session token
    const sessionToken = generateSessionToken();

    // Create user
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        email: input.userEmail,
        name: input.userName,
        organization_id: org.id,
        role: "admin",
        session_token: sessionToken,
        last_login: new Date().toISOString(),
      })
      .select()
      .single();

    if (userError || !user) {
      console.error("Error creating user:", userError);
      // Rollback organization creation
      await supabase.from("organizations").delete().eq("id", org.id);
      return { success: false, error: "Failed to create user account" };
    }

    // Create session
    const session: Session = {
      userId: user.id,
      organizationId: org.id,
      email: user.email,
      name: user.name || input.userName,
      role: user.role,
      sessionToken: sessionToken,
    };

    setSession(session);
    return { success: true, session };
  } catch (error) {
    console.error("Error during account creation:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function login(email: string): Promise<{
  success: boolean;
  session?: Session;
  error?: string;
}> {
  try {
    // Find user by email
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*, organization:organizations(*)")
      .eq("email", email)
      .single();

    if (userError || !user) {
      return { success: false, error: "User not found" };
    }

    // Generate new session token
    const sessionToken = generateSessionToken();

    // Update user with new session token
    const { error: updateError } = await supabase
      .from("users")
      .update({
        session_token: sessionToken,
        last_login: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      return { success: false, error: "Failed to create session" };
    }

    // Create session
    const session: Session = {
      userId: user.id,
      organizationId: user.organization_id,
      email: user.email,
      name: user.name || "",
      role: user.role,
      sessionToken: sessionToken,
    };

    setSession(session);
    return { success: true, session };
  } catch (error) {
    console.error("Error during login:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function loginWithDemo(): Promise<{
  success: boolean;
  session?: Session;
  error?: string;
}> {
  return login("demo@cybercomply.io");
}

export async function logout(): Promise<void> {
  const session = getSession();

  if (session?.sessionToken) {
    // Clear session token in database
    await supabase
      .from("users")
      .update({ session_token: null })
      .eq("session_token", session.sessionToken);
  }

  clearSession();
}

export async function validateSession(): Promise<boolean> {
  const session = getSession();
  if (!session?.sessionToken) return false;

  try {
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("session_token", session.sessionToken)
      .single();

    return !!user;
  } catch {
    return false;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const session = getSession();
  if (!session?.userId) return null;

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.userId)
    .single();

  return data;
}

export async function getCurrentOrganization(): Promise<Organization | null> {
  const session = getSession();
  if (!session?.organizationId) return null;

  const { data } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", session.organizationId)
    .single();

  return data;
}
