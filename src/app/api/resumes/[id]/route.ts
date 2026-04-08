// DELETE /api/resumes/[id]
// Delete a resume file
// Auth: TEACHER (must own the resume)

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";

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

    // Delete file from Supabase
    try {
      const urlParts = resume.fileUrl.split("/");
      const bucketIndex = urlParts.indexOf("Resumes");
      if (bucketIndex !== -1) {
        const filePath = urlParts.slice(bucketIndex + 1).join("/");
        await supabaseAdmin.storage.from("Resumes").remove([filePath]);
      }
    } catch (err) {
      console.warn("Failed to delete resume file from storage:", err);
      // Continue with DB deletion even if storage deletion fails
    }

    // Delete from database
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
