import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Users, Briefcase, FileText, Building2, TrendingUp, Clock, AlertCircle, ShieldCheck } from "lucide-react";

const db = prisma as any;

async function getAdminStats() {
  const [
    totalUsers, totalTeachers, totalSchools,
    totalJobs, activeJobs, totalApplications,
    recentUsers, recentJobs, recentApps,
    pendingApps, shortlistedApps,
    pendingSchools, pendingTeachers,
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

  const recentJobsList = await prisma.jobPosting.findMany({
    take: 8,
    orderBy: { postedAt: "desc" },
    select: {
      id: true, title: true, status: true, postedAt: true,
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
    jobs: { total: totalJobs, active: activeJobs, recentWeek: recentJobs },
    applications: { total: totalApplications, pending: pendingApps, shortlisted: shortlistedApps, recentWeek: recentApps },
    queue: { pendingSchools, pendingTeachers, suspendedUsers },
    recentJobsList,
    recentUsersList,
  };
}

function StatCard({ label, value, sub, icon, accent = false, href }: {
  label: string; value: number | string; sub?: string;
  icon: React.ReactNode; accent?: boolean; href?: string;
}) {
  const inner = (
    <>
      <div className={`mb-3 flex items-center gap-2 ${accent ? "text-brand-100" : "text-[var(--eh-text-4)]"}`}>
        {icon}
        <span className={`text-[12.5px] font-medium ${accent ? "text-brand-100" : "text-[var(--eh-text-3)]"}`}>{label}</span>
      </div>
      <div className={`font-display text-[28px] font-bold leading-none ${accent ? "text-white" : "text-[var(--eh-text)]"}`}>{value}</div>
      {sub && <p className={`mt-1 text-[12px] ${accent ? "text-brand-200" : "text-[var(--eh-text-4)]"}`}>{sub}</p>}
    </>
  );
  const cls = `rounded-2xl border p-5 transition-opacity ${accent ? "border-brand-700 bg-brand-600 text-white" : "border-[var(--eh-border)] bg-white"} ${href ? "hover:opacity-90 cursor-pointer" : ""}`;
  if (href) {
    return <Link href={href} className={cls}>{inner}</Link>;
  }
  return <div className={cls}>{inner}</div>;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700",
  CLOSED: "bg-[var(--surface-base)] text-[var(--eh-text-3)]",
  DRAFT: "bg-amber-50 text-amber-700",
  EXPIRED: "bg-red-50 text-red-600",
};

const ROLE_COLORS: Record<string, string> = {
  TEACHER: "bg-blue-50 text-blue-700",
  SCHOOL_ADMIN: "bg-amber-50 text-amber-700",
  ADMIN: "bg-red-50 text-red-600",
};

function timeAgo(date: Date | string) {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-[40px] font-semibold tracking-[-0.03em] text-[var(--eh-text)]">Admin Overview</h1>
        <p className="mt-0.5 text-[14px] text-[var(--eh-text-3)]">Platform health at a glance</p>
      </div>

      {/* Action queue — show only when there's something to act on */}
      {(stats.queue.pendingSchools > 0 || stats.queue.pendingTeachers > 0 || stats.queue.suspendedUsers > 0) && (
        <div className="mb-6 grid gap-3 md:grid-cols-3">
          {stats.queue.pendingSchools > 0 && (
            <Link href="/admin/schools?verificationStatus=PENDING" className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 transition-colors hover:bg-amber-100">
              <AlertCircle size={18} className="shrink-0 text-amber-600" />
              <div>
                <p className="text-[13px] font-semibold text-amber-900">{stats.queue.pendingSchools} school{stats.queue.pendingSchools !== 1 ? "s" : ""} pending verification</p>
                <p className="text-[12px] text-amber-700">Review and approve or reject</p>
              </div>
            </Link>
          )}
          {stats.queue.pendingTeachers > 0 && (
            <Link href="/admin/teachers?verificationStatus=PENDING" className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3.5 transition-colors hover:bg-blue-100">
              <ShieldCheck size={18} className="shrink-0 text-blue-600" />
              <div>
                <p className="text-[13px] font-semibold text-blue-900">{stats.queue.pendingTeachers} teacher{stats.queue.pendingTeachers !== 1 ? "s" : ""} pending verification</p>
                <p className="text-[12px] text-blue-700">Review credentials and trust signals</p>
              </div>
            </Link>
          )}
          {stats.queue.suspendedUsers > 0 && (
            <Link href="/admin/schools?suspended=true" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 transition-colors hover:bg-slate-100">
              <Users size={18} className="shrink-0 text-slate-500" />
              <div>
                <p className="text-[13px] font-semibold text-slate-800">{stats.queue.suspendedUsers} suspended account{stats.queue.suspendedUsers !== 1 ? "s" : ""}</p>
                <p className="text-[12px] text-slate-600">Review or lift suspensions</p>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard icon={<Users size={15} />} label="Total users" value={stats.users.total}
          sub={`+${stats.users.recentWeek} this week`} accent href="/admin/teachers" />
        <StatCard icon={<Briefcase size={15} />} label="Active jobs" value={stats.jobs.active}
          sub={`${stats.jobs.total} total`} href="/admin/jobs" />
        <StatCard icon={<FileText size={15} />} label="Applications" value={stats.applications.total}
          sub={`${stats.applications.pending} pending`} href="/admin/jobs" />
        <StatCard icon={<Building2 size={15} />} label="Schools" value={stats.users.schools}
          sub={`${stats.users.teachers} teachers`} href="/admin/schools" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <Link href="/admin/jobs" className="rounded-2xl border border-[var(--eh-border)] bg-white p-4 text-center hover:opacity-90 transition-opacity">
          <div className="font-display text-[22px] font-bold text-[var(--eh-text)]">{stats.jobs.recentWeek}</div>
          <div className="mt-0.5 flex items-center justify-center gap-1 text-[12px] text-[var(--eh-text-3)]"><TrendingUp size={12} />Jobs this week</div>
        </Link>
        <Link href="/admin/jobs" className="rounded-2xl border border-[var(--eh-border)] bg-white p-4 text-center hover:opacity-90 transition-opacity">
          <div className="font-display text-[22px] font-bold text-[var(--eh-text)]">{stats.applications.recentWeek}</div>
          <div className="mt-0.5 flex items-center justify-center gap-1 text-[12px] text-[var(--eh-text-3)]"><FileText size={12} />Applications this week</div>
        </Link>
        <Link href="/admin/jobs" className="rounded-2xl border border-[var(--eh-border)] bg-white p-4 text-center hover:opacity-90 transition-opacity">
          <div className="font-display text-[22px] font-bold text-amber-600">{stats.applications.shortlisted}</div>
          <div className="mt-0.5 text-[12px] text-[var(--eh-text-3)]">Shortlisted</div>
        </Link>
      </div>

      {/* Two-column tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent jobs */}
        <div className="overflow-hidden rounded-2xl border border-[var(--eh-border)] bg-white">
          <div className="flex items-center justify-between border-b border-[var(--eh-border)] px-5 py-4">
            <h2 className="text-[15px] font-semibold">Recent jobs</h2>
            <a href="/admin/jobs" className="text-[12px] text-brand-500 hover:underline">View all</a>
          </div>
          <div className="divide-y divide-[var(--surface-base)]">
            {stats.recentJobsList.map((job: any) => (
              <Link key={job.id} href={`/admin/jobs`} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-[var(--surface-base)] transition-colors">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium truncate">{job.title}</p>
                  <p className="text-[12px] text-[var(--eh-text-4)]">{job.school.schoolName} · {job.school.city}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[job.status] || "bg-[var(--surface-base)] text-[var(--eh-text-3)]"}`}>
                    {job.status}
                  </span>
                  <span className="flex items-center gap-0.5 text-[11px] text-[var(--eh-text-4)]">
                    <Clock size={11} />{timeAgo(job.postedAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent users */}
        <div className="overflow-hidden rounded-2xl border border-[var(--eh-border)] bg-white">
          <div className="flex items-center justify-between border-b border-[var(--eh-border)] px-5 py-4">
            <h2 className="text-[15px] font-semibold">Recent signups</h2>
            <a href="/admin/schools" className="text-[12px] text-brand-500 hover:underline">View schools</a>
          </div>
          <div className="divide-y divide-[var(--surface-base)]">
            {stats.recentUsersList.map((user: any) => (
              <Link key={user.id} href={user.role === "SCHOOL_ADMIN" ? "/admin/schools" : "/admin/teachers"} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-[var(--surface-base)] transition-colors">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium truncate">{user.name}</p>
                  <p className="truncate text-[12px] text-[var(--eh-text-4)]">{user.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role] || "bg-[var(--surface-base)] text-[var(--eh-text-3)]"}`}>
                    {user.role === "SCHOOL_ADMIN" ? "School" : user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                  </span>
                  <span className="text-[11px] text-[var(--eh-text-4)]">{timeAgo(user.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
