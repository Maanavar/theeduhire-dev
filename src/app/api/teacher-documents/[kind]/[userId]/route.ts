import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { canAccessTeacherPrivateDocument } from "@/lib/policies/document-policy";
import { createSignedObjectUrl } from "@/lib/storage";

const FIELD_BY_KIND = {
  "demo-video": "demoVideoUrl",
  "lesson-plan": "lessonPlanUrl",
} as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ kind: string; userId: string }> }
) {
  try {
    const auth = await requireAuth(["TEACHER", "SCHOOL_ADMIN", "ADMIN"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { kind, userId } = await params;
    if (!(kind in FIELD_BY_KIND)) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    const authorized = await canAccessTeacherPrivateDocument(prisma, auth.user, userId);
    if (!authorized) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const profile = await prisma.teacherProfile.findUnique({
      where: { userId },
      select: {
        demoVideoUrl: true,
        lessonPlanUrl: true,
      },
    });

    const fieldName = FIELD_BY_KIND[kind as keyof typeof FIELD_BY_KIND];
    const storedValue = profile?.[fieldName];

    if (!storedValue) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    const signedUrl = await createSignedObjectUrl(storedValue);
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error("GET /api/teacher-documents/[kind]/[userId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}
