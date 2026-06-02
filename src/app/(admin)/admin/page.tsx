import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Users,
  Briefcase,
  FileText,
  Building2,
  TrendingUp,
  Clock,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";

const db = prisma as any;

async function getAdminStats() {
  const [
    totalUsers,
    totalTeachers,
    totalSchools,
    totalJobs,
    activeJobs,
    totalApplications,
    recentUsers,
    recentJobs,
    recentApps,
    pendingApps,
    shortlistedApps,
    pendingSchools,
    pendingTeachers,
    suspendedUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.user.count({ where: { role: "SCHOOL_ADMIN" } }),
    prisma.jobPosting.count(),
    prisma.jobPosting.count({ where: { status: "ACTIVE" } }),
    prisma.application.count(),
    prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } } }),
    prisma.jobPosting.count({ where: { postedAt: { gte: new Date(Date.now() - 7 * 86400000) } } }),
    prisma.application.count({ where: { appliedAt: { gte: new Date(Date.now() - 7 * 86400000) } } }),
    prisma.application.count({ where: { status: "PENDING" } }),
    prisma.application.count({ where: { status: "SHORTLISTED" } }),
    db.schoolProfile.count({ where: { verificationStatus: "PENDING" } }),
    db.teacherProfile.count({ where: { verificationStatus: "PENDING" } }),
    prisma.user.count({ where: { isSuspended: true } }),
  ]);

  // Platform analytics — verification funnel, application health
  const [
    verifiedSchools,
    rejectedSchools,
    verifiedTeachers,
    rejectedTeachers,
    hiredApps,
    closedJobs,
    draftJobs,
  ] = await Promise.all([
    db.schoolProfile.count({ where: { verificationStatus: "VERIFIED" } }),
    db.schoolProfile.count({ where: { verificationStatus: "REJECTED" } }),
    db.teacherProfile.count({ where: { verificationStatus: "VERIFIED" } }),
    db.teacherProfile.count({ where: { verificationStatus: "REJECTED" } }),
    prisma.application.count({ where: { status: "HIRED" } }),
    prisma.jobPosting.count({ where: { status: "CLOSED" } }),
    prisma.jobPosting.count({ where: { status: "DRAFT" } }),
  ]);

  const recentJobsList = await prisma.jobPosting.findMany({
    take: 8,
    orderBy: { postedAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      postedAt: true,
      school: { select: { schoolName: true, city: true } },
      _count: { select: { applications: true } },
    },
  });

  const recentUsersList = await prisma.user.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return {
    users: { total: totalUsers, teachers: totalTeachers, schools: totalSchools, recentWeek: recentUsers },
    jobs: { total: totalJobs, active: activeJobs, recentWeek: recentJobs, closed: closedJobs, draft: draftJobs },
    applications: { total: totalApplications, pending: pendingApps, shortlisted: shortlistedApps, hired: hiredApps, recentWeek: recentApps },
    queue: { pendingSchools, pendingTeachers, suspendedUsers },
    verification: {
      schools: { verified: verifiedSchools, pending: pendingSchools, rejected: rejectedSchools, unverified: Math.max(0, totalSchools - verifiedSchools - pendingSchools - rejectedSchools) },
      teachers: { verified: verifiedTeachers, pending: pendingTeachers, rejected: rejectedTeachers, unverified: Math.max(0, totalTeachers - verifiedTeachers - pendingTeachers - rejectedTeachers) },
    },
    recentJobsList,
    recentUsersList,
  };
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  ACTIVE:  { label: "Active",  cls: "border-emerald-100 bg-emerald-50 text-emerald-700" },
  CLOSED:  { label: "Closed",  cls: "border-slate-200 bg-slate-50 text-slate-500" },
  DRAFT:   { label: "Draft",   cls: "border-amber-100 bg-amber-50 text-amber-700" },
  EXPIRED: { label: "Expired", cls: "border-red-100 bg-red-50 text-red-600" },
};

const ROLE_LABELS: Record<string, { label: string; cls: string }> = {
  TEACHER:     { label: "Teacher", cls: "border-sky-100 bg-sky-50 text-sky-700" },
  SCHOOL_ADMIN:{ label: "School",  cls: "border-amber-100 bg-amber-50 text-amber-700" },
  ADMIN:       { label: "Admin",   cls: "border-red-100 bg-red-50 text-red-600" },
};

function timeAgo(date: Date | string) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();

  const kpis = [
    {
      label: "Total users",
      value: stats.users.total,
      sub: `+${stats.users.recentWeek} this week`,
      icon: <Users size={15} />,
      accentBar: "bg-[var(--eh-primary-500)]",
      valueColor: "text-[var(--eh-primary-700)]",
      href: "/admin/teachers",
    },
    {
      label: "Active jobs",
      value: stats.jobs.active,
      sub: `${stats.jobs.total} total`,
      icon: <Briefcase size={15} />,
      accentBar: "bg-sky-500",
      valueColor: "text-sky-700",
      href: "/admin/jobs",
    },
    {
      label: "Applications",
      value: stats.applications.total,
      sub: `${stats.applications.pending} pending`,
      icon: <FileText size={15} />,
      accentBar: "bg-violet-500",
      valueColor: "text-violet-700",
      href: "/admin/jobs",
    },
    {
      label: "Schools",
      value: stats.users.schools,
      sub: `${stats.users.teachers} teachers`,
      icon: <Building2 size={15} />,
      accentBar: "bg-amber-400",
      valueColor: "text-amber-700",
      href: "/admin/schools",
    },
  ];

  const weeklyStats = [
    { label: "Jobs this week", value: stats.jobs.recentWeek, href: "/admin/jobs" },
    { label: "Applications this week", value: stats.applications.recentWeek, href: "/admin/jobs" },
    { label: "Shortlisted", value: stats.applications.shortlisted, href: "/admin/jobs" },
  ];

  const hasQueue =
    stats.queue.pendingSchools > 0 ||
    stats.queue.pendingTeachers > 0 ||
    stats.queue.suspendedUsers > 0;

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="border-b border-[var(--eh-border)] pb-5">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.09em] text-[var(--eh-text-4)]">
          Admin workspace
        </p>
        <h1 className="text-[24px] font-semibold leading-[1.15] tracking-[-0.022em] text-[var(--eh-text)] sm:text-[26px]">
          Platform overview
        </h1>
        <p className="mt-1.5 text-[14px] text-[var(--eh-text-3)]">
          Platform health, verification queue, and recent activity.
        </p>
      </div>

      {/* ── Action queue ── */}
      {hasQueue ? (
        <div className="grid gap-3 md:grid-cols-3">
          {stats.queue.pendingSchools > 0 && (
            <Link
              href="/admin/schools?verificationStatus=PENDING"
              className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 transition-colors hover:bg-amber-100"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-white">
                <AlertCircle size={15} className="text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-amber-900">
                  {stats.queue.pendingSchools} school{stats.queue.pendingSchools !== 1 ? "s" : ""} pending
                </p>
                <p className="text-[12px] text-amber-700">Review verification</p>
              </div>
              <ArrowRight size={13} className="ml-auto shrink-0 text-amber-500" />
            </Link>
          )}
          {stats.queue.pendingTeachers > 0 && (
            <Link
              href="/admin/teachers?verificationStatus=PENDING"
              className="flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3.5 transition-colors hover:bg-sky-100"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-200 bg-white">
                <ShieldCheck size={15} className="text-sky-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-sky-900">
                  {stats.queue.pendingTeachers} teacher{stats.queue.pendingTeachers !== 1 ? "s" : ""} pending
                </p>
                <p className="text-[12px] text-sky-700">Review credentials</p>
              </div>
              <ArrowRight size={13} className="ml-auto shrink-0 text-sky-500" />
            </Link>
          )}
          {stats.queue.suspendedUsers > 0 && (
            <Link
              href="/admin/schools?suspended=true"
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 transition-colors hover:bg-slate-100"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white">
                <Users size={15} className="text-slate-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-slate-800">
                  {stats.queue.suspendedUsers} suspended account{stats.queue.suspendedUsers !== 1 ? "s" : ""}
                </p>
                <p className="text-[12px] text-slate-600">Review or lift</p>
              </div>
              <ArrowRight size={13} className="ml-auto shrink-0 text-slate-400" />
            </Link>
          )}
        </div>
      ) : null}

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link
            key={k.label}
            href={k.href}
            className="group rounded-xl border border-[var(--eh-border)] bg-white px-4 py-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all hover:border-[var(--eh-border-strong)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.08)]"
          >
            <div className={`mb-3 h-0.5 w-6 rounded-full ${k.accentBar}`} />
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[var(--eh-text-4)]">
              {k.label}
            </p>
            <p className={`mt-1.5 text-[28px] font-semibold leading-none tracking-[-0.03em] ${k.valueColor}`}>
              {k.value}
            </p>
            <p className="mt-2 text-[12px] text-[var(--eh-text-3)]">{k.sub}</p>
          </Link>
        ))}
      </div>

      {/* ── Weekly pulse ── */}
      <div className="grid grid-cols-3 gap-3">
        {weeklyStats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-xl border border-[var(--eh-border)] bg-white px-4 py-3.5 text-center shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all hover:border-[var(--eh-border-strong)]"
          >
            <div className="flex items-center justify-center gap-1.5 text-[var(--eh-text-3)]">
              <TrendingUp size={12} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.07em]">{s.label}</span>
            </div>
            <p className="mt-1.5 text-[24px] font-semibold leading-none tracking-[-0.025em] text-[var(--eh-text)]">
              {s.value}
            </p>
          </Link>
        ))}
      </div>

      {/* ── Platform analytics ── */}
      <div className="overflow-hidden rounded-xl border border-[var(--eh-border)] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="border-b border-[var(--eh-border)] px-5 py-3.5">
          <h2 className="text-[14px] font-semibold text-[var(--eh-text)]">Platform analytics</h2>
          <p className="mt-0.5 text-[12px] text-[var(--eh-text-3)]">
            Verification coverage, application health, and job funnel across the platform.
          </p>
        </div>
        <div className="grid divide-y divide-[var(--eh-border)] md:grid-cols-3 md:divide-x md:divide-y-0">
          {/* School verification */}
          <div className="p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">
              School verification
            </p>
            <VerificationRow
              icon={<CheckCircle2 size={13} className="text-emerald-600" />}
              label="Verified"
              value={stats.verification.schools.verified}
              total={stats.users.schools}
              color="bg-emerald-500"
            />
            <VerificationRow
              icon={<Clock size={13} className="text-amber-500" />}
              label="Pending"
              value={stats.verification.schools.pending}
              total={stats.users.schools}
              color="bg-amber-400"
            />
            <VerificationRow
              icon={<XCircle size={13} className="text-red-400" />}
              label="Rejected"
              value={stats.verification.schools.rejected}
              total={stats.users.schools}
              color="bg-red-400"
            />
            <VerificationRow
              icon={<HelpCircle size={13} className="text-slate-400" />}
              label="Unverified"
              value={stats.verification.schools.unverified}
              total={stats.users.schools}
              color="bg-slate-300"
            />
          </div>

          {/* Teacher verification */}
          <div className="p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">
              Teacher verification
            </p>
            <VerificationRow
              icon={<CheckCircle2 size={13} className="text-emerald-600" />}
              label="Verified"
              value={stats.verification.teachers.verified}
              total={stats.users.teachers}
              color="bg-emerald-500"
            />
            <VerificationRow
              icon={<Clock size={13} className="text-amber-500" />}
              label="Pending"
              value={stats.verification.teachers.pending}
              total={stats.users.teachers}
              color="bg-amber-400"
            />
            <VerificationRow
              icon={<XCircle size={13} className="text-red-400" />}
              label="Rejected"
              value={stats.verification.teachers.rejected}
              total={stats.users.teachers}
              color="bg-red-400"
            />
            <VerificationRow
              icon={<HelpCircle size={13} className="text-slate-400" />}
              label="Unverified"
              value={stats.verification.teachers.unverified}
              total={stats.users.teachers}
              color="bg-slate-300"
            />
          </div>

          {/* Application & job health */}
          <div className="p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">
              Application funnel
            </p>
            <HealthRow label="Total applications" value={stats.applications.total} />
            <HealthRow
              label="Shortlisted"
              value={stats.applications.shortlisted}
              sub={stats.applications.total > 0 ? `${Math.round((stats.applications.shortlisted / stats.applications.total) * 100)}%` : "—"}
            />
            <HealthRow
              label="Hired"
              value={stats.applications.hired}
              sub={stats.applications.total > 0 ? `${Math.round((stats.applications.hired / stats.applications.total) * 100)}%` : "—"}
            />
            <div className="my-3 border-t border-[var(--eh-border)]" />
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--eh-text-4)]">
              Job status
            </p>
            <HealthRow label="Active" value={stats.jobs.active} />
            <HealthRow label="Closed" value={stats.jobs.closed} />
            <HealthRow label="Draft" value={stats.jobs.draft} />
          </div>
        </div>
      </div>

      {/* ── Recent jobs + Recent signups ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent jobs */}
        <div className="overflow-hidden rounded-xl border border-[var(--eh-border)] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between border-b border-[var(--eh-border)] px-5 py-3.5">
            <h2 className="text-[14px] font-semibold text-[var(--eh-text)]">Recent jobs</h2>
            <Link
              href="/admin/jobs"
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--eh-primary-600)] hover:text-[var(--eh-primary-800)]"
            >
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div>
            {stats.recentJobsList.map((job: any) => {
              const statusInfo = STATUS_LABELS[job.status] || { label: job.status, cls: "border-slate-200 bg-slate-50 text-slate-500" };
              return (
                <Link
                  key={job.id}
                  href="/admin/jobs"
                  className="flex items-center justify-between gap-3 border-b border-[var(--eh-border)] px-5 py-3 last:border-b-0 hover:bg-[var(--surface-base)] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-[var(--eh-text)]">{job.title}</p>
                    <p className="text-[11px] text-[var(--eh-text-4)]">
                      {job.school.schoolName} · {job.school.city}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-md border px-1.5 py-0.5 text-[10.5px] font-semibold ${statusInfo.cls}`}>
                      {statusInfo.label}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-[var(--eh-text-4)]">
                      <Clock size={10} />
                      {timeAgo(job.postedAt)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent signups */}
        <div className="overflow-hidden rounded-xl border border-[var(--eh-border)] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between border-b border-[var(--eh-border)] px-5 py-3.5">
            <h2 className="text-[14px] font-semibold text-[var(--eh-text)]">Recent signups</h2>
            <Link
              href="/admin/schools"
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--eh-primary-600)] hover:text-[var(--eh-primary-800)]"
            >
              View schools <ArrowRight size={11} />
            </Link>
          </div>
          <div>
            {stats.recentUsersList.map((user: any) => {
              const roleInfo = ROLE_LABELS[user.role] || { label: user.role, cls: "border-slate-200 bg-slate-50 text-slate-500" };
              return (
                <Link
                  key={user.id}
                  href={user.role === "SCHOOL_ADMIN" ? "/admin/schools" : "/admin/teachers"}
                  className="flex items-center justify-between gap-3 border-b border-[var(--eh-border)] px-5 py-3 last:border-b-0 hover:bg-[var(--surface-base)] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-[var(--eh-text)]">{user.name}</p>
                    <p className="truncate text-[11px] text-[var(--eh-text-4)]">{user.email}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-md border px-1.5 py-0.5 text-[10.5px] font-semibold ${roleInfo.cls}`}>
                      {roleInfo.label}
                    </span>
                    <span className="text-[11px] text-[var(--eh-text-4)]">{timeAgo(user.createdAt)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function VerificationRow({
  icon,
  label,
  value,
  total,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="mb-2.5 last:mb-0">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--eh-text-2)]">
          {icon}
          {label}
        </span>
        <span className="text-[12px] font-semibold tabular-nums text-[var(--eh-text)]">
          {value}
          <span className="ml-1 text-[11px] font-normal text-[var(--eh-text-4)]">({pct}%)</span>
        </span>
      </div>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-[var(--surface-base)]">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all ${color}`}
          style={{ width: `${Math.max(pct, value > 0 ? 4 : 0)}%` }}
        />
      </div>
    </div>
  );
}

function HealthRow({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[12px] text-[var(--eh-text-2)]">{label}</span>
      <span className="flex items-center gap-2 text-right">
        <span className="text-[13px] font-semibold tabular-nums text-[var(--eh-text)]">{value}</span>
        {sub ? (
          <span className="text-[11px] font-medium text-[var(--eh-text-4)]">{sub}</span>
        ) : null}
      </span>
    </div>
  );
}
