import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/session";

const improveJobInputSchema = z.object({
  title: z.string().min(2),
  subject: z.string().min(1),
  gradeLevel: z.string().min(1),
  board: z.string().min(1),
  experience: z.string().optional(),
  description: z.string().optional(),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
});

const improveJobOutputSchema = z.object({
  description: z.string().min(50),
  requirements: z.array(z.string().min(1)).min(3).max(12),
  benefits: z.array(z.string().min(1)).min(2).max(10),
});

function extractJsonObject(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return trimmed.slice(start, end + 1);
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(["SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const parsed = improveJobInputSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid request payload" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "ANTHROPIC_API_KEY is not configured" },
        { status: 503 }
      );
    }

    const model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";
    const input = parsed.data;

    const prompt = [
      "Improve this education job post so it is specific, credible, and concise.",
      "Return ONLY valid JSON with keys: description, requirements, benefits.",
      "Rules:",
      "- description: 2 short paragraphs, no markdown",
      "- requirements: array of concrete bullet text (no numbering prefix)",
      "- benefits: array of concise benefit text",
      "- keep truthful and avoid hype",
      "",
      `title: ${input.title}`,
      `subject: ${input.subject}`,
      `gradeLevel: ${input.gradeLevel}`,
      `board: ${input.board}`,
      `experience: ${input.experience || "Not specified"}`,
      `description: ${input.description || ""}`,
      `requirements: ${input.requirements || ""}`,
      `benefits: ${input.benefits || ""}`,
    ].join("\n");

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1200,
        temperature: 0.2,
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: prompt }],
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errorText = await anthropicRes.text();
      console.error("POST /api/ai/improve-job anthropic error:", anthropicRes.status, errorText);
      return NextResponse.json(
        { success: false, error: "AI service unavailable. Please try again shortly." },
        { status: 502 }
      );
    }

    const completion = await anthropicRes.json();
    const responseText = Array.isArray(completion?.content)
      ? completion.content
          .filter((item: any) => item?.type === "text" && typeof item?.text === "string")
          .map((item: any) => item.text)
          .join("\n")
      : "";
    const jsonPayload = extractJsonObject(responseText);
    if (!jsonPayload) {
      return NextResponse.json({ success: false, error: "AI response was not valid JSON" }, { status: 502 });
    }

    const outputParse = improveJobOutputSchema.safeParse(JSON.parse(jsonPayload));
    if (!outputParse.success) {
      return NextResponse.json({ success: false, error: "AI response validation failed" }, { status: 502 });
    }

    return NextResponse.json({ success: true, data: outputParse.data });
  } catch (error) {
    console.error("POST /api/ai/improve-job error:", error);
    return NextResponse.json({ success: false, error: "Failed to improve job details" }, { status: 500 });
  }
}
