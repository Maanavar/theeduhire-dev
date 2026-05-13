import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import {
  ALLOWED_LESSON_PLAN_EXTENSIONS,
  ALLOWED_LESSON_PLAN_TYPES,
  MAX_LESSON_PLAN_SIZE,
  TEACHER_LESSON_PLAN_BUCKET,
} from "@/config/constants";
import {
  createStorageObjectRef,
  ensureBucket,
  fileMatchesAllowedTypes,
  getFileExtension,
  getTeacherDocumentAccessPath,
} from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(["TEACHER"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    if (!fileMatchesAllowedTypes(file, ALLOWED_LESSON_PLAN_TYPES, ALLOWED_LESSON_PLAN_EXTENSIONS)) {
      return NextResponse.json(
        { success: false, error: "Only PDF, DOC, and DOCX files are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_LESSON_PLAN_SIZE) {
      return NextResponse.json(
        { success: false, error: "File must be under 10MB" },
        { status: 400 }
      );
    }

    await ensureBucket(TEACHER_LESSON_PLAN_BUCKET, "private", "10MB");

    const ext = getFileExtension(file.name) || "pdf";
    const storagePath = `${auth.user.id}/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = ALLOWED_LESSON_PLAN_TYPES.includes(file.type)
      ? file.type
      : ext === "doc"
        ? "application/msword"
        : ext === "docx"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : "application/pdf";

    const { error: uploadError } = await supabaseAdmin.storage
      .from(TEACHER_LESSON_PLAN_BUCKET)
      .upload(storagePath, buffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase lesson plan upload error:", uploadError);
      return NextResponse.json(
        { success: false, error: "File upload failed. Please try again." },
        { status: 500 }
      );
    }

    const storedFileRef = createStorageObjectRef(TEACHER_LESSON_PLAN_BUCKET, storagePath);

    await prisma.teacherProfile.upsert({
      where: { userId: auth.user.id },
      update: { lessonPlanUrl: storedFileRef },
      create: {
        userId: auth.user.id,
        subjects: [],
        lessonPlanUrl: storedFileRef,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        lessonPlanUrl: getTeacherDocumentAccessPath("lesson-plan", auth.user.id),
        fileName: file.name,
      },
    });
  } catch (error) {
    console.error("POST /api/upload/lesson-plan error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload lesson plan" },
      { status: 500 }
    );
  }
}
