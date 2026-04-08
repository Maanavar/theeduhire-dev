// PUT /api/profile/experience/[id] — update
// DELETE /api/profile/experience/[id] — delete
// Auth: TEACHER (must own the experience)

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { experienceSchema } from "@/lib/validators/profile";

async function verifyOwnership(id: string, userId: string) {
  const experience = await prisma.experience.findUnique({
    where: { id },
    include: { teacherProfile: { select: { userId: true } } },
  });

  if (!experience || experience.teacherProfile.userId !== userId) {
    return null;
  }

  return experience;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(["TEACHER"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    // Verify ownership
    const experience = await verifyOwnership(id, auth.user.id);
    if (!experience) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = experienceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { schoolName, role, startDate, endDate, isCurrent, description } = parsed.data;

    const updated = await prisma.experience.update({
      where: { id },
      data: {
        schoolName,
        role,
        startDate: new Date(startDate),
        endDate: isCurrent ? null : endDate ? new Date(endDate) : null,
        isCurrent,
        description: description || null,
      },
    });

    return NextResponse.json({ success: true, data: { experience: updated } });
  } catch (error) {
    console.error("PUT /api/profile/experience/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update experience" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(["TEACHER"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    // Verify ownership
    const experience = await verifyOwnership(id, auth.user.id);
    if (!experience) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    await prisma.experience.delete({ where: { id } });

    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    console.error("DELETE /api/profile/experience/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete experience" },
      { status: 500 }
    );
  }
}
