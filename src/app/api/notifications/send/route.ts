// POST /api/notifications/send — internal notification router
// Delegates to email (Resend) — SMS/WhatsApp via MSG91 can be added later

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { sendStatusUpdate, sendApplicationConfirmation } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(["ADMIN", "SCHOOL_ADMIN"]);
    if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const { type, recipientId, data } = await req.json();
    if (!type || !recipientId) return NextResponse.json({ success: false, error: "type and recipientId required" }, { status: 400 });

    const recipient = await prisma.user.findUnique({ where: { id: recipientId }, select: { email: true, name: true } });
    if (!recipient) return NextResponse.json({ success: false, error: "Recipient not found" }, { status: 404 });

    switch (type) {
      case "STATUS_CHANGED":
        await sendStatusUpdate({
          teacherEmail: recipient.email,
          teacherName: recipient.name,
          jobTitle: data.jobTitle,
          schoolName: data.schoolName,
          newStatus: data.status,
          jobId: data.jobId,
        });
        break;
      case "APPLICATION_RECEIVED":
        await sendApplicationConfirmation({
          teacherEmail: recipient.email,
          teacherName: recipient.name,
          jobTitle: data.jobTitle,
          schoolName: data.schoolName,
          jobId: data.jobId,
        });
        break;
      default:
        return NextResponse.json({ success: false, error: `Unknown notification type: ${type}` }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/notifications/send error:", error);
    return NextResponse.json({ success: false, error: "Failed to send notification" }, { status: 500 });
  }
}
