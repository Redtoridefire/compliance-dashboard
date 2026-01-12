import OpenAI from "openai";
import type { Control, Framework, ControlImplementation, Organization } from "@/types";

// Create OpenAI client (server-side only)
export function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  return new OpenAI({ apiKey });
}

// Gap Analysis Recommendation
export interface GapAnalysisInput {
  control: Control;
  implementation: ControlImplementation | null;
  frameworks: Array<{ framework: Framework; controlId: string }>;
}

export async function generateGapRecommendation(
  input: GapAnalysisInput
): Promise<string> {
  const openai = createOpenAIClient();

  const prompt = `You are a cybersecurity compliance expert specializing in financial services regulations.

Analyze this control gap and provide actionable remediation guidance:

**Control Information:**
- Control: ${input.control.title}
- Control ID: ${input.control.control_id}
- Description: ${input.control.description || "No description available"}
- Priority: ${input.control.priority}
- Control Family: ${input.control.control_family}

**Current Implementation:**
- Status: ${input.implementation?.implementation_status || "Not Implemented"}
- Notes: ${input.implementation?.implementation_notes || "None provided"}
- Last Reviewed: ${input.implementation?.last_reviewed_at || "Never"}

**Frameworks Requiring This Control:**
${input.frameworks.map((f) => `- ${f.framework.name} (${f.framework.abbreviation}): Control ${f.controlId}`).join("\n")}

**Provide:**
1. **Remediation Steps** (3-5 specific, actionable steps)
2. **Estimated Effort** (Low: <1 week, Medium: 1-4 weeks, High: >1 month)
3. **Priority Justification** (Why this matters)
4. **Common Implementation Approaches** (2-3 industry-standard methods)
5. **Potential Pitfalls** (What to avoid)

Be concise, specific, and actionable. Focus on practical implementation in a financial services context.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 800,
  });

  return completion.choices[0]?.message?.content || "Unable to generate recommendation.";
}

// Framework Selection Assistant
export interface FrameworkSelectionInput {
  organization: Organization;
  availableFrameworks: Framework[];
}

export async function suggestFrameworks(
  input: FrameworkSelectionInput
): Promise<string> {
  const openai = createOpenAIClient();

  const prompt = `You are a compliance advisor helping a financial services organization select appropriate cybersecurity frameworks.

**Organization Profile:**
- Industry: ${input.organization.industry}
- Sub-Industry: ${input.organization.sub_industry || "General"}
- Company Size: ${input.organization.company_size || "Unknown"}
- Geography: ${input.organization.geography?.join(", ") || "Not specified"}

**Available Frameworks:**
${input.availableFrameworks.map((f) => `- ${f.name} (${f.abbreviation}): ${f.description?.slice(0, 100)}...`).join("\n")}

**Task:**
Recommend the 3-5 most critical frameworks for this organization. For each recommendation:
1. Framework name and abbreviation
2. Why it's essential (regulatory requirement, customer expectation, risk reduction)
3. Priority level (Must Have, Should Have, Nice to Have)
4. Brief implementation timeline estimate

Prioritize mandatory regulatory frameworks first, then industry-standard frameworks that enhance security posture.

Format your response as a structured list.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 800,
  });

  return completion.choices[0]?.message?.content || "Unable to generate framework suggestions.";
}

// Control Mapping Suggestion
export interface ControlMappingInput {
  controlA: { framework: string; controlId: string; description: string };
  controlB: { framework: string; controlId: string; description: string };
}

export async function suggestControlMapping(
  input: ControlMappingInput
): Promise<{
  mappingType: string;
  confidenceScore: number;
  reasoning: string;
}> {
  const openai = createOpenAIClient();

  const prompt = `Analyze if these controls are equivalent, partial matches, or related:

Control A: ${input.controlA.framework} - ${input.controlA.controlId}
${input.controlA.description}

Control B: ${input.controlB.framework} - ${input.controlB.controlId}
${input.controlB.description}

Determine:
1. Mapping type: Equivalent (same requirement), Partial (overlapping), Related (similar concept), None (different)
2. Confidence score (0.0 to 1.0)
3. Brief reasoning (1-2 sentences)

Respond in JSON format:
{
  "mappingType": "Equivalent|Partial|Related|None",
  "confidenceScore": 0.85,
  "reasoning": "Both controls require..."
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 200,
  });

  const content = completion.choices[0]?.message?.content || "";

  try {
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Fall back to default
  }

  return {
    mappingType: "None",
    confidenceScore: 0,
    reasoning: "Unable to analyze mapping.",
  };
}

// Compliance Chat
export interface ChatContext {
  organization: Organization;
  selectedFrameworks: Framework[];
  complianceScore: number;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function generateChatResponse(
  messages: ChatMessage[],
  context: ChatContext
): Promise<string> {
  const openai = createOpenAIClient();

  const systemPrompt = `You are an AI compliance assistant for CyberComply, helping organizations achieve cybersecurity framework compliance.

**Organization Context:**
- Name: ${context.organization.name}
- Industry: ${context.organization.industry}
- Size: ${context.organization.company_size || "Unknown"}
- Active Frameworks: ${context.selectedFrameworks.map((f) => f.abbreviation).join(", ") || "None selected"}
- Overall Compliance: ${context.complianceScore}%

**Instructions:**
- Provide specific, actionable compliance guidance
- Reference the organization's selected frameworks when relevant
- Be concise but thorough (2-4 paragraphs max)
- If asked about specific controls, reference control IDs
- Suggest next steps or action items
- Maintain a professional, helpful tone
- If you don't know something specific about their implementation, ask clarifying questions`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
    ],
    temperature: 0.7,
    max_tokens: 600,
  });

  return completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";
}

// Rate limiting helper (simple in-memory tracking)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in ms

export function checkRateLimit(organizationId: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(organizationId);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(organizationId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export function getRateLimitRemaining(organizationId: string): number {
  const record = rateLimitMap.get(organizationId);
  if (!record || Date.now() > record.resetTime) {
    return RATE_LIMIT;
  }
  return Math.max(0, RATE_LIMIT - record.count);
}
