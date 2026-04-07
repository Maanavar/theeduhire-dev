// GET /api/schools/[id] — Public school profile + active job count

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const school = await prisma.schoolProfile.findUnique({
      where: { id },
      select: {
        id: true, schoolName: true, city: true, board: true,
        address: true, website: true, about: true, logoUrl: true, verified: true,
        _count: { select: { jobPostings: { where: { status: "ACTIVE" } } } },
      },
    });

    if (!school) {
      return NextResponse.json({ success: false, error: "School not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: school });
  } catch (error) {
    console.error("GET /api/schools/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch school" }, { status: 500 });
  }
}
