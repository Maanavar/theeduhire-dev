import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import {
  ALLOWED_DEMO_VIDEO_EXTENSIONS,
  ALLOWED_DEMO_VIDEO_TYPES,
  MAX_DEMO_VIDEO_SIZE,
  TEACHER_DEMO_VIDEO_BUCKET,
} from "@/config/constants";
import {
  createStorageObjectRef,
  ensureBucket,
  fileBufferMatchesAllowedContent,
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

    if (!fileMatchesAllowedTypes(file, ALLOWED_DEMO_VIDEO_TYPES, ALLOWED_DEMO_VIDEO_EXTENSIONS)) {
      return NextResponse.json(
        { success: false, error: "Only MP4, MOV, and WebM files are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_DEMO_VIDEO_SIZE) {
      return NextResponse.json(
        { success: false, error: "File must be under 100MB" },
        { status: 400 }
      );
    }

    await ensureBucket(TEACHER_DEMO_VIDEO_BUCKET, "private", "100MB");

    const ext = getFileExtension(file.name) || "mp4";
    const storagePath = `${auth.user.id}/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!fileBufferMatchesAllowedContent(buffer, file.name, "demo-video", file.type)) {
      return NextResponse.json(
        { success: false, error: "File content does not match the selected video type" },
        { status: 400 }
      );
    }
    const contentType = ALLOWED_DEMO_VIDEO_TYPES.includes(file.type) ? file.type : `video/${ext === "mov" ? "quicktime" : ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(TEACHER_DEMO_VIDEO_BUCKET)
      .upload(storagePath, buffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase demo video upload error:", uploadError);
      return NextResponse.json(
        { success: false, error: "File upload failed. Please try again." },
        { status: 500 }
      );
    }

    const storedFileRef = createStorageObjectRef(TEACHER_DEMO_VIDEO_BUCKET, storagePath);

    await prisma.teacherProfile.upsert({
      where: { userId: auth.user.id },
      update: { demoVideoUrl: storedFileRef },
      create: {
        userId: auth.user.id,
        subjects: [],
        demoVideoUrl: storedFileRef,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        demoVideoUrl: getTeacherDocumentAccessPath("demo-video", auth.user.id),
        fileName: file.name,
      },
    });
  } catch (error) {
    console.error("POST /api/upload/demo-video error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload demo video" },
      { status: 500 }
    );
  }
}
