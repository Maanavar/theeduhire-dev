import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { generateVerificationToken } from "@/lib/auth";
import { SUBJECTS } from "@/config/constants";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/security";
import {
  beginIdempotentRequest,
  completeIdempotentRequest,
  getIdempotencyKey,
  releaseIdempotentRequest,
  stableHash,
} from "@/lib/idempotency";
import { publishDomainEvent } from "@/lib/domain-events";
import { AUTH_RATE_LIMIT_WINDOW_MS, AUTH_REGISTER_IP_LIMIT } from "@/config/constants";
import { sanitizePlainText } from "@/lib/sanitize";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  role: z.enum(["TEACHER", "SCHOOL_ADMIN"]),
  phone: z.string().trim().max(30).optional(),
  teacherProfile: z
    .object({
      experience: z.string().trim().max(100).optional(),
      subjects: z.array(z.enum(SUBJECTS)).max(8).optional(),
      city: z.string().trim().max(100).optional(),
      preferredJobType: z.string().trim().max(50).optional(),
    })
    .optional(),
  schoolProfile: z
    .object({
      schoolName: z.string().trim().min(2).max(200),
      city: z.string().trim().min(1).max(100),
      board: z.enum(["CBSE", "ICSE", "STATE_BOARD", "IB", "CAMBRIDGE", "OTHER"]).default("CBSE"),
    })
    .optional(),
}).superRefine((data, ctx) => {
  if (data.role === "TEACHER") {
    if (!data.teacherProfile?.subjects || data.teacherProfile.subjects.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "At least one subject is required for teacher signup",
        path: ["teacherProfile", "subjects"],
      });
    }
  }
  if (data.role === "SCHOOL_ADMIN") {
    if (!data.schoolProfile?.schoolName?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "School name is required for school signup",
        path: ["schoolProfile", "schoolName"],
      });
    }
    if (!data.schoolProfile?.city?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "City is required for school signup",
        path: ["schoolProfile", "city"],
      });
    }
  }
});

export async function POST(req: NextRequest) {
  let idempotencyRecordId: string | null = null;

  try {
    const body = await req.json();
    const clientIp = getClientIp(req);
    const rateLimit = await checkRateLimit({
      key: `auth.register:${clientIp}`,
      action: "auth.register",
      actorKey: clientIp,
      limit: AUTH_REGISTER_IP_LIMIT,
      windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many signup attempts. Please try again later." },
        { status: 429 }
      );
    }
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { name: rawName, email, password, role, phone, teacherProfile, schoolProfile } = parsed.data;
    const name = sanitizePlainText(rawName);
    const normalizedEmail = email.toLowerCase().trim();
    const requestHash = stableHash({
      name,
      email: normalizedEmail,
      role,
      phone: phone?.trim() || null,
      teacherProfile: teacherProfile || null,
      schoolProfile: schoolProfile || null,
    });
    const idempotency = await beginIdempotentRequest(prisma, {
      scope: "auth.register",
      actorKey: normalizedEmail,
      key: getIdempotencyKey(req.headers.get("idempotency-key"), requestHash),
      requestHash,
    });

    if (idempotency.kind === "replay") {
      return NextResponse.json(idempotency.responseBody, { status: idempotency.responseStatus });
    }

    if (idempotency.kind === "conflict") {
      return NextResponse.json({ success: false, error: idempotency.error }, { status: idempotency.status });
    }

    idempotencyRecordId = idempotency.recordId;

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      const responseBody = { success: false, error: "An account with this email already exists" };
      await completeIdempotentRequest(prisma, idempotency.recordId, 409, responseBody);
      return NextResponse.json(responseBody, { status: 409 });
    }

    const hashedPassword = await hash(password, 12);

    const normalizedPhone = phone?.trim() ? phone.trim() : null;
    const normalizedSubjects =
      teacherProfile?.subjects
        ?.map((subject) => subject.trim())
        .filter(Boolean)
        .filter((subject, index, all) => all.findIndex((s) => s.toLowerCase() === subject.toLowerCase()) === index) || [];

    const user = await prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          hashedPassword,
          role,
          phone: normalizedPhone,
          emailVerified: false,
        },
      });

      if (role === "TEACHER") {
        await tx.teacherProfile.create({
          data: {
            userId: newUser.id,
            experience: teacherProfile?.experience?.trim() || null,
            city: teacherProfile?.city?.trim() || null,
            subjects: normalizedSubjects,
            preferredJobTypes: teacherProfile?.preferredJobType
              ? [teacherProfile.preferredJobType]
              : [],
          },
        });
      } else {
        await tx.schoolProfile.create({
          data: {
            userId: newUser.id,
            schoolName: schoolProfile?.schoolName?.trim() || "",
            city: schoolProfile?.city?.trim() || "",
            board: schoolProfile?.board || "CBSE",
          },
        });
      }

      await publishDomainEvent(tx, {
        eventType: role === "TEACHER" ? "teacher_registered" : "school_admin_registered",
        aggregateType: "user",
        aggregateId: newUser.id,
        actorId: newUser.id,
        payload: {
          userId: newUser.id,
          role: newUser.role,
          email: newUser.email,
          schoolProfile: role === "SCHOOL_ADMIN" ? {
            schoolName: schoolProfile?.schoolName?.trim() || "",
            city: schoolProfile?.city?.trim() || "",
            board: schoolProfile?.board || "CBSE",
          } : null,
          teacherProfile: role === "TEACHER" ? {
            experience: teacherProfile?.experience?.trim() || null,
            city: teacherProfile?.city?.trim() || null,
            subjects: normalizedSubjects,
            preferredJobTypes: teacherProfile?.preferredJobType
              ? [teacherProfile.preferredJobType]
              : [],
          } : null,
        },
        metadata: {
          source: "api.auth.register",
        },
      });

      return newUser;
    });

    // Send verification email non-blocking
    const token = generateVerificationToken(user.id);
    sendVerificationEmail(normalizedEmail, name, token).catch((err) =>
      console.error("Verification email error:", err)
    );

    const responseBody = {
      success: true,
      data: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
    await completeIdempotentRequest(prisma, idempotency.recordId, 201, responseBody);

    return NextResponse.json(responseBody, { status: 201 });
  } catch (error) {
    if (idempotencyRecordId) {
      await releaseIdempotentRequest(prisma, idempotencyRecordId);
    }
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      { success: false, error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
