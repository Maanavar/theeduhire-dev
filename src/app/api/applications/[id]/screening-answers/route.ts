// GET /api/applications/[id]/screening-answers
// Returns the screening questions for the job + the candidate's answers

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { canManageApplication } from "@/lib/policies/application-policy";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["SCHOOL_ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { id: applicationId } = await params;

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      jobId: true,
      applicantId: true,
      job: {
        select: {
          postedBy: true,
          schoolId: true,
          screeningQuestions: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              question: true,
              questionType: true,
              options: true,
              required: true,
              sortOrder: true,
            },
          },
        },
      },
      screeningAnswers: {
        select: {
          id: true,
          questionId: true,
          questionSnapshot: true,
          answer: true,
          createdAt: true,
        },
      },
    },
  });

  if (!application) {
    return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
  }

  const allowed = await canManageApplication(prisma, auth.user, { job: application.job });
  if (!allowed) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const answerMap = new Map(application.screeningAnswers.map((a) => [a.questionId, a]));

  const data = application.job.screeningQuestions.map((q) => ({
    questionId: q.id,
    question: q.question,
    questionType: q.questionType,
    options: q.options,
    required: q.required,
    answer: answerMap.get(q.id)?.answer ?? null,
    answeredAt: answerMap.get(q.id)?.createdAt ?? null,
  }));

  return NextResponse.json({ success: true, data });
}
