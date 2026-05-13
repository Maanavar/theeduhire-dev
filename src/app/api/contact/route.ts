import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendContactNotification } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/security";
import { CONTACT_FORM_IP_LIMIT, CONTACT_FORM_RATE_LIMIT_WINDOW_MS } from "@/config/constants";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().optional(),
  message: z.string().min(10),
});

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateLimit = await checkRateLimit({
      key: `contact:${clientIp}`,
      action: "contact.submit",
      actorKey: clientIp,
      limit: CONTACT_FORM_IP_LIMIT,
      windowMs: CONTACT_FORM_RATE_LIMIT_WINDOW_MS,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, error: "Too many messages sent. Please try again later." }, { status: 429 });
    }
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid form data" }, { status: 400 });
    }
    const { name, email, message } = parsed.data;
    await sendContactNotification({ senderName: name, senderEmail: email, message });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/contact error:", error);
    return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 });
  }
}
