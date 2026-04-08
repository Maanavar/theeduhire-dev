import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { generateVerificationToken } from "@/lib/auth";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  role: z.enum(["TEACHER", "SCHOOL_ADMIN"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { name, email, password, role } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);

    const user = await prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          hashedPassword,
          role,
          emailVerified: process.env.NODE_ENV === "development" ? true : false, // verified via email link (dev mode skips verification)
        },
      });

      if (role === "TEACHER") {
        await tx.teacherProfile.create({ data: { userId: newUser.id } });
      } else {
        await tx.schoolProfile.create({
          data: { userId: newUser.id, schoolName: "", city: "", board: "CBSE" },
        });
      }

      return newUser;
    });

    // Send verification email non-blocking
    const token = generateVerificationToken(user.id);
    sendVerificationEmail(normalizedEmail, name, token).catch((err) =>
      console.error("Verification email error:", err)
    );

    return NextResponse.json(
      { success: true, data: { id: user.id, email: user.email, name: user.name, role: user.role } },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      { success: false, error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
