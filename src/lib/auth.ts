import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";
import type { UserRole } from "@prisma/client";
import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.NEXTAUTH_SECRET || "fallback-dev-secret";
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      image?: string | null;
    };
  }
  interface User {
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },

  providers: [
    // Google OAuth — ONLY creates Teacher accounts.
    // School admins MUST use credential signup to select their role.
    // Google button is only shown on the signup page (not signin).
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "TEACHER" as UserRole,
        };
      },
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user || !user.hashedPassword) {
          throw new Error("Invalid email or password");
        }

        const isValid = await compare(credentials.password, user.hashedPassword);
        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        if (!user.emailVerified) {
          throw new Error("Please verify your email address before signing in. Check your inbox for the verification link.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          // Google signup always creates a Teacher account
          const newUser = await prisma.user.create({
            data: {
              email: user.email!.toLowerCase().trim(),
              name: user.name || "Teacher",
              role: "TEACHER",
              avatarUrl: user.image,
              emailVerified: true, // Google email is verified
            },
          });

          await prisma.teacherProfile.create({
            data: { userId: newUser.id },
          });

          user.id = newUser.id;
          user.role = newUser.role;
        } else {
          user.id = existingUser.id;
          user.role = existingUser.role;
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};

export function generateVerificationToken(userId: string): string {
  const timestamp = Date.now();
  const payload = userId + ":" + timestamp;
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(payload + ":" + sig).toString("base64url");
}

export function verifyToken(token: string): { userId: string; valid: boolean; expired?: boolean } {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    const secondLastColon = decoded.lastIndexOf(":", lastColon - 1);
    if (lastColon === -1 || secondLastColon === -1) return { userId: "", valid: false };

    const sig = decoded.slice(lastColon + 1);
    const payload = decoded.slice(0, lastColon);
    const userId = decoded.slice(0, secondLastColon);
    const timestamp = parseInt(decoded.slice(secondLastColon + 1, lastColon), 10);

    if (isNaN(timestamp)) return { userId: "", valid: false };
    if (Date.now() - timestamp > TOKEN_TTL_MS) return { userId, valid: false, expired: true };

    const expected = createHmac("sha256", SECRET).update(payload).digest("hex");
    const sigBuf = Buffer.from(sig, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return { userId, valid: false };
    }
    return { userId, valid: true };
  } catch {
    return { userId: "", valid: false };
  }
}
