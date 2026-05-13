import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
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

    const { name, email, password, role, phone, teacherProfile, schoolProfile } = parsed.data;
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
    const verifyUrl = `${process.env.NEXTAUTH_URL || "https://theeduhire.in"}/auth/verify?token=${token}`;
    const verificationHtml = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f4f0;padding:32px 16px;color:#1a1a18">
        <div style="background:#fff;border-radius:16px;padding:40px;max-width:540px;margin:0 auto;border:1px solid #e8e7e0">
          <div style="font-size:20px;font-weight:700;color:#2a7a4e;margin-bottom:32px">EduHire</div>
          <h1 style="font-size:22px;font-weight:700;margin:0 0 12px">Verify your email address</h1>
          <p style="font-size:15px;line-height:1.6;color:#444441;margin:0 0 16px">Hi ${name},</p>
          <p style="font-size:15px;line-height:1.6;color:#444441;margin:0 0 16px">Thanks for joining EduHire! Please verify your email address to activate your account.</p>
          <a href="${verifyUrl}" style="display:inline-block;padding:13px 28px;background:#2a7a4e;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;margin:8px 0 24px">Verify Email Address</a>
          <p style="font-size:13px;color:#888780;margin:0">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
        </div>
      </div>
    `;

    sendEmail({
      to: normalizedEmail,
      subject: "Verify your EduHire account",
      html: verificationHtml,
    }).catch((err) => console.error("Verification email error:", err));

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
