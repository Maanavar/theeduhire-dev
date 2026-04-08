// POST /api/upload/resume
// Auth: TEACHER
// Multipart form data — PDF/DOC/DOCX, max 5MB
// Uploads to Supabase Storage bucket "resumes"
// Creates Resume record in DB
// Returns: { resumeId, fileUrl, fileName }

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { MAX_RESUME_SIZE, ALLOWED_RESUME_TYPES } from "@/config/constants";

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

    if (!ALLOWED_RESUME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Only PDF, DOC, and DOCX files are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_RESUME_SIZE) {
      return NextResponse.json(
        { success: false, error: "File must be under 5MB" },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop() || "pdf";
    const storagePath = `${auth.user.id}/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from("Resumes")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { success: false, error: "File upload failed. Please try again." },
        { status: 500 }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("Resumes")
      .getPublicUrl(storagePath);

    const resume = await prisma.resume.create({
      data: {
        userId: auth.user.id,
        fileUrl: urlData.publicUrl,
        fileName: file.name,
        fileSize: file.size,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        resumeId: resume.id,
        fileUrl: resume.fileUrl,
        fileName: resume.fileName,
      },
    });
  } catch (error) {
    console.error("POST /api/upload/resume error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload resume" },
      { status: 500 }
    );
  }
}
