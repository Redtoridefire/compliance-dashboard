import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { generateSessionToken } from "@/lib/utils";
import bcrypt from "bcryptjs";

// Demo mode storage (in-memory for demo purposes)
const demoUsers: Map<string, {
  id: string;
  email: string;
  name: string;
  role: string;
  organization_id: string;
  session_token: string | null;
  password_hash: string;
}> = new Map();

const demoOrganizations: Map<string, {
  id: string;
  name: string;
  industry: string;
  sub_industry?: string;
  company_size?: string;
  geography?: string;
}> = new Map();

// Hash password
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    // Check Supabase configuration at RUNTIME (isSupabaseConfigured is now a function)
    const supabaseReady = isSupabaseConfigured();
    console.log("[Auth API] Supabase configured:", supabaseReady);

    // Demo mode handling
    if (!supabaseReady) {
      console.log("[Auth API] Using demo mode");
      return await handleDemoMode(action, data);
    }

    const supabase = createServerClient();

    switch (action) {
      case "login": {
        const { email, password } = data;

        if (!password) {
          return NextResponse.json(
            { error: "Password is required" },
            { status: 400 }
          );
        }

        // Find user by email (case-insensitive)
        const { data: user, error: userError } = await supabase
          .from("users")
          .select("*, organization:organizations(*)")
          .ilike("email", email)
          .single();

        if (userError || !user) {
          return NextResponse.json(
            { error: "Invalid email or password" },
            { status: 401 }
          );
        }

        // Verify password
        if (!user.password_hash) {
          // Legacy user without password - allow login and prompt to set password
          console.log("[Auth] Legacy user without password, allowing login");
        } else {
          const passwordValid = await verifyPassword(password, user.password_hash);
          if (!passwordValid) {
            return NextResponse.json(
              { error: "Invalid email or password" },
              { status: 401 }
            );
          }
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
          return NextResponse.json(
            { error: "Failed to create session" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          session: {
            userId: user.id,
            organizationId: user.organization_id,
            email: user.email,
            name: user.name || "",
            role: user.role,
            sessionToken: sessionToken,
          },
          organization: user.organization,
        });
      }

      case "register": {
        const {
          organizationName,
          industry,
          subIndustry,
          companySize,
          geography,
          userName,
          userEmail,
          password,
        } = data;

        // Validate password
        if (!password || password.length < 8) {
          return NextResponse.json(
            { error: "Password must be at least 8 characters" },
            { status: 400 }
          );
        }

        // Check if user already exists (case-insensitive)
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .ilike("email", userEmail)
          .single();

        if (existingUser) {
          return NextResponse.json(
            { error: "User with this email already exists" },
            { status: 400 }
          );
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create organization
        const { data: org, error: orgError } = await supabase
          .from("organizations")
          .insert({
            name: organizationName,
            industry,
            sub_industry: subIndustry,
            company_size: companySize,
            geography,
          })
          .select()
          .single();

        if (orgError || !org) {
          return NextResponse.json(
            { error: "Failed to create organization" },
            { status: 500 }
          );
        }

        // Generate session token
        const sessionToken = generateSessionToken();

        // Create user with password hash
        const { data: user, error: userError } = await supabase
          .from("users")
          .insert({
            email: userEmail,
            name: userName,
            organization_id: org.id,
            role: "admin",
            session_token: sessionToken,
            password_hash: passwordHash,
            last_login: new Date().toISOString(),
          })
          .select()
          .single();

        if (userError || !user) {
          // Rollback organization creation
          await supabase.from("organizations").delete().eq("id", org.id);
          return NextResponse.json(
            { error: "Failed to create user" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          session: {
            userId: user.id,
            organizationId: org.id,
            email: user.email,
            name: user.name,
            role: user.role,
            sessionToken: sessionToken,
          },
          organization: org,
        });
      }

      case "logout": {
        const { sessionToken } = data;

        if (sessionToken) {
          await supabase
            .from("users")
            .update({ session_token: null })
            .eq("session_token", sessionToken);
        }

        return NextResponse.json({ success: true });
      }

      case "validate": {
        const { sessionToken } = data;

        const { data: user } = await supabase
          .from("users")
          .select("id, email, name, role, organization_id")
          .eq("session_token", sessionToken)
          .single();

        if (!user) {
          return NextResponse.json({ valid: false }, { status: 401 });
        }

        return NextResponse.json({ valid: true, user });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Auth API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Demo mode handler - provides full functionality without database
async function handleDemoMode(action: string, data: Record<string, unknown>) {
  switch (action) {
    case "login": {
      const { email, password } = data as { email: string; password: string };

      if (!password) {
        return NextResponse.json(
          { error: "Password is required" },
          { status: 400 }
        );
      }

      // Find demo user by email (case-insensitive)
      const user = Array.from(demoUsers.values()).find(
        u => u.email.toLowerCase() === email.toLowerCase()
      );

      if (!user) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      // Verify password
      const passwordValid = await verifyPassword(password, user.password_hash);
      if (!passwordValid) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      // Generate new session token
      const sessionToken = generateSessionToken();
      user.session_token = sessionToken;
      demoUsers.set(user.id, user);

      const organization = demoOrganizations.get(user.organization_id);

      return NextResponse.json({
        session: {
          userId: user.id,
          organizationId: user.organization_id,
          email: user.email,
          name: user.name,
          role: user.role,
          sessionToken: sessionToken,
        },
        organization,
        demo: true,
      });
    }

    case "register": {
      const {
        organizationName,
        industry,
        subIndustry,
        companySize,
        geography,
        userName,
        userEmail,
        password,
      } = data as {
        organizationName: string;
        industry: string;
        subIndustry?: string;
        companySize?: string;
        geography?: string;
        userName: string;
        userEmail: string;
        password: string;
      };

      // Validate password
      if (!password || password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }

      // Check if user already exists in demo (case-insensitive)
      const existingUser = Array.from(demoUsers.values()).find(
        u => u.email.toLowerCase() === userEmail.toLowerCase()
      );
      if (existingUser) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 400 }
        );
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create demo organization
      const orgId = `demo-org-${Date.now()}`;
      const org = {
        id: orgId,
        name: organizationName,
        industry,
        sub_industry: subIndustry,
        company_size: companySize,
        geography,
      };
      demoOrganizations.set(orgId, org);

      // Generate session token
      const sessionToken = generateSessionToken();

      // Create demo user with password hash
      const userId = `demo-user-${Date.now()}`;
      const user = {
        id: userId,
        email: userEmail,
        name: userName,
        organization_id: orgId,
        role: "admin",
        session_token: sessionToken,
        password_hash: passwordHash,
      };
      demoUsers.set(userId, user);

      return NextResponse.json({
        session: {
          userId: user.id,
          organizationId: org.id,
          email: user.email,
          name: user.name,
          role: user.role,
          sessionToken: sessionToken,
        },
        organization: org,
        demo: true,
      });
    }

    case "logout": {
      const { sessionToken } = data as { sessionToken?: string };

      if (sessionToken) {
        const user = Array.from(demoUsers.values()).find(u => u.session_token === sessionToken);
        if (user) {
          user.session_token = null;
          demoUsers.set(user.id, user);
        }
      }

      return NextResponse.json({ success: true, demo: true });
    }

    case "validate": {
      const { sessionToken } = data as { sessionToken: string };

      const user = Array.from(demoUsers.values()).find(u => u.session_token === sessionToken);

      if (!user) {
        return NextResponse.json({ valid: false }, { status: 401 });
      }

      return NextResponse.json({
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organization_id: user.organization_id,
        },
        demo: true,
      });
    }

    default:
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
  }
}
