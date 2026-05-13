// GET /api/resumes/[id]
// Download a resume file for the owner or an authorized school reviewer.
// DELETE /api/resumes/[id]
// Delete a resume file
// Auth: TEACHER (must own the resume)

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { canAccessTeacherPrivateDocument } from "@/lib/policies/document-policy";
import { createSignedObjectUrl, removeStoredObject } from "@/lib/storage";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth(["TEACHER", "SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const resume = await prisma.resume.findUnique({
      where: { id },
      select: { id: true, userId: true, fileUrl: true },
    });

    if (!resume) {
      return NextResponse.json({ success: false, error: "Resume not found" }, { status: 404 });
    }

    const authorized = await canAccessTeacherPrivateDocument(prisma, auth.user, resume.userId);
    if (!authorized) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const signedUrl = await createSignedObjectUrl(resume.fileUrl);
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error("GET /api/resumes/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch resume" },
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

    // Get resume and verify ownership
    const resume = await prisma.resume.findUnique({
      where: { id },
    });

    if (!resume || resume.userId !== auth.user.id) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    try {
      await removeStoredObject(resume.fileUrl);
    } catch (err) {
      console.warn("Failed to delete resume file from storage:", err);
    }

    await prisma.resume.delete({ where: { id } });

    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    console.error("DELETE /api/resumes/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete resume" },
      { status: 500 }
    );
  }
}
