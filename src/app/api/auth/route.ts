import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generateSessionToken } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    const supabase = createServerClient();

    switch (action) {
      case "login": {
        const { email } = data;

        // Find user by email
        const { data: user, error: userError } = await supabase
          .from("users")
          .select("*, organization:organizations(*)")
          .eq("email", email)
          .single();

        if (userError || !user) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
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
        } = data;

        // Check if user already exists
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("email", userEmail)
          .single();

        if (existingUser) {
          return NextResponse.json(
            { error: "User with this email already exists" },
            { status: 400 }
          );
        }

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

        // Create user
        const { data: user, error: userError } = await supabase
          .from("users")
          .insert({
            email: userEmail,
            name: userName,
            organization_id: org.id,
            role: "admin",
            session_token: sessionToken,
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
