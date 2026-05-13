import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { canUsersMessageEachOther } from "@/lib/messaging-permissions";
import { checkRateLimit } from "@/lib/rate-limit";
import { MESSAGE_CREATE_RATE_LIMIT, MESSAGE_CREATE_RATE_LIMIT_WINDOW_MS } from "@/config/constants";
const db = prisma as any;

export async function GET() {
  try {
    const auth = await requireAuth(["TEACHER", "SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const userId = auth.user.id;
    const participants = await db.conversationParticipant.findMany({
      where: { userId, archivedAt: null },
      include: {
        conversation: {
          include: {
            participants: { include: { user: { select: { id: true, name: true, role: true } } } },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: { sender: { select: { id: true, name: true } } },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const data = participants.map((p: any) => {
      const conversation = p.conversation;
      const lastMessage = conversation.messages[0] || null;
      const otherParticipants = conversation.participants.filter((cp: any) => cp.userId !== userId).map((cp: any) => cp.user);
      const unread = !!lastMessage && lastMessage.senderId !== userId && (!p.lastReadAt || lastMessage.createdAt > p.lastReadAt);
      return {
        id: conversation.id,
        subject: conversation.subject,
        lastMessageAt: conversation.lastMessageAt,
        unread,
        lastMessage,
        participants: otherParticipants,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/messages error:", error);
    return NextResponse.json({ success: false, error: "Failed to load conversations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(["TEACHER", "SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const body = await req.json();
    const participantIds = Array.isArray(body.participantIds) ? body.participantIds.filter((id: unknown) => typeof id === "string") : [];
    const initialMessage = typeof body.message === "string" ? body.message.trim() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : null;

    if (participantIds.length === 0 || !initialMessage) {
      return NextResponse.json({ success: false, error: "participantIds and message are required" }, { status: 400 });
    }

    const rateLimit = await checkRateLimit({
      key: `messages.create:${auth.user.id}`,
      action: "messages.create",
      actorKey: auth.user.id,
      limit: MESSAGE_CREATE_RATE_LIMIT,
      windowMs: MESSAGE_CREATE_RATE_LIMIT_WINDOW_MS,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, error: "Too many new conversations started. Please try again later." }, { status: 429 });
    }

    const uniqueParticipantIds = Array.from(new Set([auth.user.id, ...participantIds]));
    const users = await prisma.user.findMany({
      where: { id: { in: uniqueParticipantIds } },
      select: { id: true, role: true },
    });

    if (users.length !== uniqueParticipantIds.length) {
      return NextResponse.json({ success: false, error: "One or more participants were not found" }, { status: 404 });
    }

    for (const target of users) {
      if (target.id === auth.user.id) continue;
      const allowed = await canUsersMessageEachOther(auth.user.id, auth.user.role, target.id, target.role);
      if (!allowed) {
        return NextResponse.json({ success: false, error: "Messaging is only allowed between matched teachers and school admins" }, { status: 403 });
      }
    }

    const created = await prisma.$transaction(async (tx: any) => {
      const conversation = await tx.conversation.create({
        data: {
          createdBy: auth.user.id,
          subject,
          lastMessageAt: new Date(),
          participants: {
            create: uniqueParticipantIds.map((userId) => ({ userId, lastReadAt: userId === auth.user.id ? new Date() : null })),
          },
          messages: {
            create: {
              senderId: auth.user.id,
              body: initialMessage,
            },
          },
        },
      });

      const recipientIds = uniqueParticipantIds.filter((id) => id !== auth.user.id);
      if (recipientIds.length > 0) {
        await tx.notification.createMany({
          data: recipientIds.map((userId) => ({
            userId,
            type: "MESSAGE",
            title: "New message",
            body: `${auth.user.name} sent you a message`,
            payload: { conversationId: conversation.id },
          })),
        });
      }

      return conversation;
    });

    return NextResponse.json({ success: true, data: { id: created.id } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/messages error:", error);
    return NextResponse.json({ success: false, error: "Failed to create conversation" }, { status: 500 });
  }
}
