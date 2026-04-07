import { prisma } from "@/lib/prisma";
import { Users, Briefcase, FileText, Building2, TrendingUp, Clock } from "lucide-react";

async function getAdminStats() {
  const [
    totalUsers, totalTeachers, totalSchools,
    totalJobs, activeJobs, totalApplications,
    recentUsers, recentJobs, recentApps,
    pendingApps, shortlistedApps,
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
    recentJobsList,
    recentUsersList,
  };
}

function StatCard({ label, value, sub, icon, accent = false }: {
  label: string; value: number | string; sub?: string;
  icon: React.ReactNode; accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 border ${accent ? "bg-brand-600 border-brand-700 text-white" : "bg-white border-gray-100"}`}>
      <div className={`flex items-center gap-2 mb-3 ${accent ? "text-brand-100" : "text-gray-400"}`}>
        {icon}
        <span className={`text-[12.5px] font-medium ${accent ? "text-brand-100" : "text-gray-500"}`}>{label}</span>
      </div>
      <div className={`font-display text-[28px] font-bold leading-none ${accent ? "text-white" : "text-gray-900"}`}>{value}</div>
      {sub && <p className={`text-[12px] mt-1 ${accent ? "text-brand-200" : "text-gray-400"}`}>{sub}</p>}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700",
  CLOSED: "bg-gray-100 text-gray-500",
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
        <h1 className="font-display text-[28px] font-bold">Admin Overview</h1>
        <p className="text-[14px] text-gray-500 mt-0.5">Platform health at a glance</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard icon={<Users size={15} />} label="Total users" value={stats.users.total}
          sub={`+${stats.users.recentWeek} this week`} accent />
        <StatCard icon={<Briefcase size={15} />} label="Active jobs" value={stats.jobs.active}
          sub={`${stats.jobs.total} total`} />
        <StatCard icon={<FileText size={15} />} label="Applications" value={stats.applications.total}
          sub={`${stats.applications.pending} pending`} />
        <StatCard icon={<Building2 size={15} />} label="Schools" value={stats.users.schools}
          sub={`${stats.users.teachers} teachers`} />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
          <div className="font-display text-[22px] font-bold text-gray-900">{stats.jobs.recentWeek}</div>
          <div className="text-[12px] text-gray-500 mt-0.5 flex items-center justify-center gap-1"><TrendingUp size={12} />Jobs this week</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
          <div className="font-display text-[22px] font-bold text-gray-900">{stats.applications.recentWeek}</div>
          <div className="text-[12px] text-gray-500 mt-0.5 flex items-center justify-center gap-1"><FileText size={12} />Applications this week</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
          <div className="font-display text-[22px] font-bold text-amber-600">{stats.applications.shortlisted}</div>
          <div className="text-[12px] text-gray-500 mt-0.5">Shortlisted</div>
        </div>
      </div>

      {/* Two-column tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent jobs */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Recent jobs</h2>
            <a href="/admin/jobs" className="text-[12px] text-brand-500 hover:underline">View all</a>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recentJobsList.map((job) => (
              <div key={job.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium truncate">{job.title}</p>
                  <p className="text-[12px] text-gray-400">{job.school.schoolName} · {job.school.city}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[job.status] || "bg-gray-100 text-gray-500"}`}>
                    {job.status}
                  </span>
                  <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                    <Clock size={11} />{timeAgo(job.postedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent users */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Recent signups</h2>
            <a href="/admin/schools" className="text-[12px] text-brand-500 hover:underline">View schools</a>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recentUsersList.map((user) => (
              <div key={user.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium truncate">{user.name}</p>
                  <p className="text-[12px] text-gray-400 truncate">{user.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role] || "bg-gray-100"}`}>
                    {user.role === "SCHOOL_ADMIN" ? "School" : user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                  </span>
                  <span className="text-[11px] text-gray-400">{timeAgo(user.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
