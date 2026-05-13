// POST /api/profile/avatar
// Upload profile photo to Supabase avatars bucket
// Auth: TEACHER or SCHOOL_ADMIN
// Multipart form data — JPEG/PNG/WebP, max 2MB
// Returns: { avatarUrl }

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(["TEACHER", "SCHOOL_ADMIN"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const formData = await req.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Only JPEG, PNG, and WebP images are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_AVATAR_SIZE) {
      return NextResponse.json(
        { success: false, error: "File must be under 2MB" },
        { status: 400 }
      );
    }

    // Get current user to check for old avatar
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { avatarUrl: true },
    });

    // Delete old avatar if exists
    if (user?.avatarUrl) {
      try {
        // Extract storage path from URL: https://...bucket/avatar/userId/filename
        const urlParts = user.avatarUrl.split("/");
        const bucketIndex = urlParts.indexOf("avatar");
        if (bucketIndex !== -1) {
          const oldPath = urlParts.slice(bucketIndex + 1).join("/");
          await supabaseAdmin.storage.from("avatar").remove([oldPath]);
        }
      } catch (err) {
        // Silently fail — old file might not exist
        console.warn("Failed to delete old avatar:", err);
      }
    }

    // Upload new avatar
    const ext = file.type.split("/")[1] || "jpg"; // jpeg -> jpg
    const storagePath = `${auth.user.id}/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatar")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { success: false, error: "Upload failed. Please try again." },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("avatar")
      .getPublicUrl(storagePath);

    // Update user avatar in DB
    await prisma.user.update({
      where: { id: auth.user.id },
      data: { avatarUrl: urlData.publicUrl },
    });

    return NextResponse.json({
      success: true,
      data: { avatarUrl: urlData.publicUrl },
    });
  } catch (error) {
    console.error("POST /api/profile/avatar error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update avatar" },
      { status: 500 }
    );
  }
}
