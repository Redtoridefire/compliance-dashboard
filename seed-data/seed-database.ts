import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables.");
  console.error("Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SeedFramework {
  name: string;
  abbreviation: string;
  category: string;
  description: string;
  version: string;
  applicable_industries: string[];
  documentation_url: string;
}

interface SeedControl {
  framework_abbreviation: string;
  control_id: string;
  title: string;
  description: string;
  control_family: string;
  priority: string;
  implementation_guidance: string;
}

interface SeedMapping {
  source_framework: string;
  source_control_id: string;
  target_framework: string;
  target_control_id: string;
  mapping_type: string;
  confidence_score: number;
  mapping_notes?: string;
}

async function loadJsonFile<T>(filename: string): Promise<T> {
  const filePath = path.join(__dirname, filename);
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content) as T;
}

async function seedFrameworks(): Promise<Map<string, string>> {
  console.log("Seeding frameworks...");
  const frameworks = await loadJsonFile<SeedFramework[]>("frameworks.json");
  const frameworkIdMap = new Map<string, string>();

  for (const framework of frameworks) {
    const { data, error } = await supabase
      .from("frameworks")
      .upsert(
        {
          name: framework.name,
          abbreviation: framework.abbreviation,
          category: framework.category,
          description: framework.description,
          version: framework.version,
          applicable_industries: framework.applicable_industries,
          documentation_url: framework.documentation_url,
          is_active: true,
        },
        { onConflict: "abbreviation" }
      )
      .select("id, abbreviation")
      .single();

    if (error) {
      console.error(`Error seeding framework ${framework.abbreviation}:`, error);
    } else if (data) {
      frameworkIdMap.set(data.abbreviation, data.id);
      console.log(`  ✓ ${framework.abbreviation}`);
    }
  }

  console.log(`Seeded ${frameworkIdMap.size} frameworks.\n`);
  return frameworkIdMap;
}

async function seedControls(
  frameworkIdMap: Map<string, string>
): Promise<Map<string, string>> {
  console.log("Seeding controls...");
  const controls = await loadJsonFile<SeedControl[]>("controls.json");
  const controlIdMap = new Map<string, string>();
  let successCount = 0;

  for (const control of controls) {
    const frameworkId = frameworkIdMap.get(control.framework_abbreviation);
    if (!frameworkId) {
      console.error(`  ✗ Framework not found: ${control.framework_abbreviation}`);
      continue;
    }

    const { data, error } = await supabase
      .from("controls")
      .upsert(
        {
          framework_id: frameworkId,
          control_id: control.control_id,
          title: control.title,
          description: control.description,
          control_family: control.control_family,
          priority: control.priority,
          implementation_guidance: control.implementation_guidance,
        },
        { onConflict: "framework_id,control_id" }
      )
      .select("id, control_id, framework_id")
      .single();

    if (error) {
      console.error(
        `  ✗ Error seeding control ${control.framework_abbreviation}:${control.control_id}:`,
        error.message
      );
    } else if (data) {
      // Create a composite key for mapping lookup
      const key = `${control.framework_abbreviation}:${control.control_id}`;
      controlIdMap.set(key, data.id);
      successCount++;
    }
  }

  console.log(`Seeded ${successCount} controls.\n`);
  return controlIdMap;
}

async function seedControlMappings(
  controlIdMap: Map<string, string>
): Promise<void> {
  console.log("Seeding control mappings...");
  const mappings = await loadJsonFile<SeedMapping[]>("control-mappings.json");
  let successCount = 0;
  let skipCount = 0;

  for (const mapping of mappings) {
    const sourceKey = `${mapping.source_framework}:${mapping.source_control_id}`;
    const targetKey = `${mapping.target_framework}:${mapping.target_control_id}`;

    const sourceControlId = controlIdMap.get(sourceKey);
    const targetControlId = controlIdMap.get(targetKey);

    if (!sourceControlId || !targetControlId) {
      skipCount++;
      continue;
    }

    const { error } = await supabase.from("control_mappings").upsert(
      {
        source_control_id: sourceControlId,
        target_control_id: targetControlId,
        mapping_type: mapping.mapping_type,
        confidence_score: mapping.confidence_score,
        mapping_notes: mapping.mapping_notes,
      },
      { onConflict: "source_control_id,target_control_id" }
    );

    if (error) {
      console.error(`  ✗ Error seeding mapping ${sourceKey} -> ${targetKey}:`, error.message);
    } else {
      successCount++;
    }
  }

  console.log(`Seeded ${successCount} control mappings (skipped ${skipCount}).\n`);
}

async function createDemoOrganization(): Promise<void> {
  console.log("Creating demo organization...");

  // Check if demo org already exists
  const { data: existingOrg } = await supabase
    .from("organizations")
    .select("id")
    .eq("name", "Demo Fintech Corp")
    .single();

  if (existingOrg) {
    console.log("  Demo organization already exists, skipping.\n");
    return;
  }

  // Create organization
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: "Demo Fintech Corp",
      industry: "fintech",
      sub_industry: "Digital Payments",
      company_size: "51-200",
      geography: ["united_states", "new_york"],
    })
    .select()
    .single();

  if (orgError || !org) {
    console.error("  ✗ Error creating demo organization:", orgError);
    return;
  }

  console.log(`  ✓ Created organization: ${org.name}`);

  // Create demo user
  const { data: user, error: userError } = await supabase
    .from("users")
    .insert({
      email: "demo@cybercomply.io",
      name: "Demo User",
      organization_id: org.id,
      role: "admin",
      session_token: "demo-session-token-12345",
    })
    .select()
    .single();

  if (userError || !user) {
    console.error("  ✗ Error creating demo user:", userError);
    return;
  }

  console.log(`  ✓ Created user: ${user.email}`);

  // Get some frameworks to assign
  const { data: frameworks } = await supabase
    .from("frameworks")
    .select("id, abbreviation")
    .in("abbreviation", ["NYDFS 500", "SOC 2", "ISO 27001"]);

  if (frameworks) {
    for (const framework of frameworks) {
      const { error: ofError } = await supabase
        .from("organization_frameworks")
        .insert({
          organization_id: org.id,
          framework_id: framework.id,
          compliance_status: "In Progress",
        });

      if (ofError) {
        console.error(`  ✗ Error assigning framework ${framework.abbreviation}:`, ofError);
      } else {
        console.log(`  ✓ Assigned framework: ${framework.abbreviation}`);
      }
    }
  }

  console.log("Demo organization setup complete.\n");
}

async function main() {
  console.log("╔════════════════════════════════════════════╗");
  console.log("║   CyberComply Database Seeding Script      ║");
  console.log("╚════════════════════════════════════════════╝\n");

  try {
    // Seed frameworks first
    const frameworkIdMap = await seedFrameworks();

    // Seed controls with framework references
    const controlIdMap = await seedControls(frameworkIdMap);

    // Seed control mappings with control references
    await seedControlMappings(controlIdMap);

    // Create demo organization
    await createDemoOrganization();

    console.log("═══════════════════════════════════════════");
    console.log("✓ Database seeding completed successfully!");
    console.log("═══════════════════════════════════════════");
  } catch (error) {
    console.error("Fatal error during seeding:", error);
    process.exit(1);
  }
}

main();
