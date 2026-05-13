import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
const db = prisma as any;

async function ensureParticipant(conversationId: string, userId: string) {
  return db.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const auth = await requireAuth(["TEACHER", "SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const { threadId } = await params;
    const participant = await ensureParticipant(threadId, auth.user.id);
    if (!participant) return NextResponse.json({ success: false, error: "Not authorized for this thread" }, { status: 403 });

    const [conversation, messages] = await Promise.all([
      db.conversation.findUnique({
        where: { id: threadId },
        include: {
          participants: {
            include: { user: { select: { id: true, name: true, role: true } } },
          },
        },
      }),
      db.message.findMany({
        where: { conversationId: threadId },
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true } } },
      }),
    ]);

    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    await db.conversationParticipant.update({
      where: { conversationId_userId: { conversationId: threadId, userId: auth.user.id } },
      data: { lastReadAt: new Date(), archivedAt: null },
    });

    return NextResponse.json({
      success: true,
      data: {
        conversation: {
          id: conversation.id,
          subject: conversation.subject,
          participants: conversation.participants.map((p: any) => p.user),
          lastMessageAt: conversation.lastMessageAt,
        },
        messages,
      },
    });
  } catch (error) {
    console.error("GET /api/messages/[threadId] error:", error);
    return NextResponse.json({ success: false, error: "Failed to load conversation" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const auth = await requireAuth(["TEACHER", "SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const { threadId } = await params;
    const participant = await ensureParticipant(threadId, auth.user.id);
    if (!participant) return NextResponse.json({ success: false, error: "Not authorized for this thread" }, { status: 403 });

    const body = await req.json();
    const messageText = typeof body.message === "string" ? body.message.trim() : "";
    if (!messageText) return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 });

    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: { conversationId: threadId, senderId: auth.user.id, body: messageText },
        include: { sender: { select: { id: true, name: true } } },
      });

      await tx.conversation.update({ where: { id: threadId }, data: { lastMessageAt: created.createdAt } });

      await tx.conversationParticipant.updateMany({
        where: { conversationId: threadId, userId: auth.user.id },
        data: { lastReadAt: created.createdAt, archivedAt: null },
      });

      const recipients = await tx.conversationParticipant.findMany({
        where: { conversationId: threadId, userId: { not: auth.user.id } },
        select: { userId: true },
      });

      if (recipients.length > 0) {
        await tx.notification.createMany({
          data: recipients.map((r: any) => ({
            userId: r.userId,
            type: "MESSAGE",
            title: "New message",
            body: `${auth.user.name} sent you a message`,
            payload: { conversationId: threadId },
          })),
        });
      }

      return created;
    });

    return NextResponse.json({ success: true, data: message }, { status: 201 });
  } catch (error) {
    console.error("POST /api/messages/[threadId] error:", error);
    return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const auth = await requireAuth(["TEACHER", "SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const { threadId } = await params;
    const participant = await ensureParticipant(threadId, auth.user.id);
    if (!participant) return NextResponse.json({ success: false, error: "Not authorized for this thread" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const archive = !!body.archive;

    await db.conversationParticipant.update({
      where: { conversationId_userId: { conversationId: threadId, userId: auth.user.id } },
      data: {
        lastReadAt: new Date(),
        archivedAt: archive ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/messages/[threadId] error:", error);
    return NextResponse.json({ success: false, error: "Failed to update conversation state" }, { status: 500 });
  }
}
