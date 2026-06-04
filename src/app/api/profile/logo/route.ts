import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { fileBufferMatchesAllowedContent } from "@/lib/storage";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
const LOGO_BUCKET = "school-logos";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(["SCHOOL_ADMIN"]);
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const schoolProfile = await prisma.schoolProfile.findUnique({
      where: { userId: auth.user.id },
      select: { id: true, logoUrl: true },
    });
    if (!schoolProfile) {
      return NextResponse.json({ success: false, error: "Please complete school profile first" }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("logo") as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Only JPEG, PNG, and WebP images are allowed" },
        { status: 400 }
      );
    }
    if (file.size > MAX_LOGO_SIZE) {
      return NextResponse.json(
        { success: false, error: "Logo must be under 2MB" },
        { status: 400 }
      );
    }

    if (schoolProfile.logoUrl) {
      try {
        const urlParts = schoolProfile.logoUrl.split("/");
        const bucketIndex = urlParts.indexOf(LOGO_BUCKET);
        if (bucketIndex !== -1) {
          const oldPath = urlParts.slice(bucketIndex + 1).join("/");
          await supabaseAdmin.storage.from(LOGO_BUCKET).remove([oldPath]);
        }
      } catch (error) {
        console.warn("Failed to delete old school logo:", error);
      }
    }

    const ext = file.type.split("/")[1] || "png";
    const storagePath = `${schoolProfile.id}/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!fileBufferMatchesAllowedContent(buffer, file.name, "image", file.type)) {
      return NextResponse.json(
        { success: false, error: "File content does not match the selected image type" },
        { status: 400 }
      );
    }

    const { error: uploadError } = await supabaseAdmin.storage
      .from(LOGO_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("School logo upload failed:", uploadError);
      return NextResponse.json({ success: false, error: "Upload failed. Please try again." }, { status: 500 });
    }

    const { data: publicUrl } = supabaseAdmin.storage.from(LOGO_BUCKET).getPublicUrl(storagePath);

    const updated = await prisma.schoolProfile.update({
      where: { id: schoolProfile.id },
      data: { logoUrl: publicUrl.publicUrl },
      select: { logoUrl: true },
    });

    return NextResponse.json({ success: true, data: { logoUrl: updated.logoUrl } });
  } catch (error) {
    console.error("POST /api/profile/logo error:", error);
    return NextResponse.json({ success: false, error: "Failed to upload school logo" }, { status: 500 });
  }
}
