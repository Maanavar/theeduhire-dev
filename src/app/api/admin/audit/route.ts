import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const db = prisma as any;

const ADMIN_ENTITY_TYPES = ["school", "teacher", "job"];

export async function GET(req: NextRequest) {
  const auth = await requireAuth(["ADMIN"]);
  if ("error" in auth) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 50;
    const entityType = searchParams.get("entityType");
    const action = searchParams.get("action");
    const actorId = searchParams.get("actorId");
    const search = searchParams.get("search") || "";
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: any = {
      aggregateType: { in: ADMIN_ENTITY_TYPES },
      metadata: { path: ["source"], equals: "admin_panel" },
    };

    if (entityType && ADMIN_ENTITY_TYPES.includes(entityType)) {
      where.aggregateType = entityType;
    }
    if (action) {
      where.eventType = action;
    }
    if (actorId) {
      where.actorId = actorId;
    }
    if (from || to) {
      where.occurredAt = {};
      if (from) where.occurredAt.gte = new Date(from);
      if (to) where.occurredAt.lte = new Date(to);
    }
    if (search) {
      where.OR = [
        { payload: { path: ["entityLabel"], string_contains: search } },
      ];
    }

    const [events, total] = await Promise.all([
      db.domainEvent.findMany({
        where,
        select: {
          id: true,
          eventType: true,
          aggregateType: true,
          aggregateId: true,
          actorId: true,
          payload: true,
          occurredAt: true,
        },
        orderBy: { occurredAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.domainEvent.count({ where }),
    ]);

    // Enrich with admin names in a single query
    const actorIds = [...new Set(events.map((e: any) => e.actorId).filter(Boolean))] as string[];
    const actors = actorIds.length
      ? await prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const actorMap = Object.fromEntries(actors.map((a) => [a.id, a]));

    const enriched = events.map((event: any) => ({
      ...event,
      actor: event.actorId ? (actorMap[event.actorId] ?? null) : null,
    }));

    return NextResponse.json({
      success: true,
      data: enriched,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/admin/audit error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch audit log" }, { status: 500 });
  }
}
