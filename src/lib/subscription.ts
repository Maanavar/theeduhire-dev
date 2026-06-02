import { prisma } from "@/lib/prisma";

export const FREE_POST_LIMIT = 2;
export const GROWTH_POST_LIMIT = 10;
export const PRO_POST_LIMIT = Infinity;

export const POST_LIMITS: Record<string, number> = {
  FREE: FREE_POST_LIMIT,
  GROWTH: GROWTH_POST_LIMIT,
  PRO: PRO_POST_LIMIT,
};

export type SchoolPlanInfo = {
  plan: "FREE" | "GROWTH" | "PRO";
  status: "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED";
  postsUsed: number;
  cycleResetAt: Date | null;
};

export type TeacherPlanInfo = {
  plan: "FREE" | "PRO";
  status: "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED";
};

export type PostJobCheck = {
  allowed: boolean;
  reason?: string;
  postsUsed: number;
  postsLimit: number;
  plan: string;
};

export async function getSchoolPlan(userId: string): Promise<SchoolPlanInfo> {
  const sub = await prisma.schoolSubscription.findUnique({
    where: { schoolUserId: userId },
    select: {
      plan: true,
      status: true,
      postsUsedThisCycle: true,
      cycleResetAt: true,
    },
  });

  if (!sub || sub.status === "CANCELED") {
    return { plan: "FREE", status: "ACTIVE", postsUsed: 0, cycleResetAt: null };
  }

  return {
    plan: sub.plan as "FREE" | "GROWTH" | "PRO",
    status: sub.status as "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED",
    postsUsed: sub.postsUsedThisCycle,
    cycleResetAt: sub.cycleResetAt,
  };
}

export async function getTeacherPlan(userId: string): Promise<TeacherPlanInfo> {
  const sub = await prisma.teacherSubscription.findUnique({
    where: { teacherUserId: userId },
    select: { plan: true, status: true },
  });

  if (!sub || sub.status === "CANCELED") {
    return { plan: "FREE", status: "ACTIVE" };
  }

  return {
    plan: sub.plan as "FREE" | "PRO",
    status: sub.status as "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED",
  };
}

export async function canPostJob(userId: string): Promise<PostJobCheck> {
  const sub = await prisma.schoolSubscription.findUnique({
    where: { schoolUserId: userId },
    select: { plan: true, status: true, postsUsedThisCycle: true },
  });

  // No subscription record or canceled → treat as FREE, use live count
  if (!sub || sub.status === "CANCELED" || sub.plan === "FREE") {
    const activeCount = await prisma.jobPosting.count({
      where: { postedBy: userId, status: "ACTIVE" as any },
    });
    return {
      allowed: activeCount < FREE_POST_LIMIT,
      reason:
        activeCount >= FREE_POST_LIMIT
          ? `Free plan allows ${FREE_POST_LIMIT} active job posts. Upgrade to Growth to post more.`
          : undefined,
      postsUsed: activeCount,
      postsLimit: FREE_POST_LIMIT,
      plan: "FREE",
    };
  }

  const plan = sub.plan as "GROWTH" | "PRO";
  const limit = POST_LIMITS[plan] ?? FREE_POST_LIMIT;
  const postsUsed = sub.postsUsedThisCycle;

  if (sub.status === "PAST_DUE") {
    // Downgrade to FREE behaviour for overdue subscriptions
    const activeCount = await prisma.jobPosting.count({
      where: { postedBy: userId, status: "ACTIVE" as any },
    });
    return {
      allowed: activeCount < FREE_POST_LIMIT,
      reason:
        activeCount >= FREE_POST_LIMIT
          ? `Your subscription payment is overdue. You are limited to ${FREE_POST_LIMIT} active posts until it is resolved.`
          : undefined,
      postsUsed: activeCount,
      postsLimit: FREE_POST_LIMIT,
      plan: "FREE",
    };
  }

  return {
    allowed: limit === Infinity || postsUsed < limit,
    reason:
      limit !== Infinity && postsUsed >= limit
        ? `Your ${plan} plan allows ${limit} active job posts per cycle. Upgrade to Pro for unlimited posts.`
        : undefined,
    postsUsed,
    postsLimit: limit,
    plan,
  };
}

export async function canViewContactDetails(userId: string): Promise<boolean> {
  const { plan, status } = await getSchoolPlan(userId);
  if (status === "PAST_DUE" || status === "CANCELED") return false;
  return plan === "GROWTH" || plan === "PRO";
}

export async function canUseAIShortlist(userId: string): Promise<boolean> {
  const { plan, status } = await getSchoolPlan(userId);
  if (status === "PAST_DUE" || status === "CANCELED") return false;
  return plan === "GROWTH" || plan === "PRO";
}

export async function canViewAnalytics(userId: string): Promise<boolean> {
  const { plan, status } = await getSchoolPlan(userId);
  if (status === "PAST_DUE" || status === "CANCELED") return false;
  return plan === "PRO";
}

export async function isTeacherFeatured(userId: string): Promise<boolean> {
  const { plan, status } = await getTeacherPlan(userId);
  if (status === "PAST_DUE" || status === "CANCELED") return false;
  return plan === "PRO";
}
