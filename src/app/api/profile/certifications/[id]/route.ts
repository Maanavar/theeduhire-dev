// PUT /api/profile/certifications/[id] — update
// DELETE /api/profile/certifications/[id] — delete
// Auth: TEACHER (must own the certification)

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { certificationSchema } from "@/lib/validators/profile";

async function verifyOwnership(id: string, userId: string) {
  const certification = await prisma.certification.findUnique({
    where: { id },
    include: { teacherProfile: { select: { userId: true } } },
  });

  if (!certification || certification.teacherProfile.userId !== userId) {
    return null;
  }

  return certification;
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
    const certification = await verifyOwnership(id, auth.user.id);
    if (!certification) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = certificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, issuedBy, issuedAt, expiresAt, credentialId } = parsed.data;

    const updated = await prisma.certification.update({
      where: { id },
      data: {
        name,
        issuedBy,
        issuedAt: new Date(issuedAt),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        credentialId: credentialId || null,
      },
    });

    return NextResponse.json({ success: true, data: { certification: updated } });
  } catch (error) {
    console.error("PUT /api/profile/certifications/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update certification" },
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
    const certification = await verifyOwnership(id, auth.user.id);
    if (!certification) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    await prisma.certification.delete({ where: { id } });

    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    console.error("DELETE /api/profile/certifications/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete certification" },
      { status: 500 }
    );
  }
}
