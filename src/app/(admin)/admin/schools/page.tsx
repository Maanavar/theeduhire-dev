"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, BadgeCheck, ShieldOff, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { getBoardLabel, timeAgo } from "@/lib/utils";

interface AdminSchool {
  id: string;
  schoolName: string;
  city: string;
  board: string;
  verified: boolean;
  user: { email: string; createdAt: string };
  _count: { jobPostings: number };
}

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<AdminSchool[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [page, setPage] = useState(1);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchSchools = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (verifiedFilter) params.set("verified", verifiedFilter);

    fetch(`/api/admin/schools?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) { setSchools(data.data); setTotal(data.pagination.total); }
      })
      .catch(() => toast.error("Failed to load schools"))
      .finally(() => setLoading(false));
  }, [page, search, verifiedFilter]);

  useEffect(() => { fetchSchools(); }, [fetchSchools]);

  const toggleVerify = async (school: AdminSchool) => {
    const action = school.verified ? "unverify" : "verify";
    setActionId(school.id);
    try {
      const res = await fetch("/api/admin/schools", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId: school.id, action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(action === "verify" ? `${school.schoolName} verified` : `Verification removed`);
        setSchools((prev) => prev.map((s) => s.id === school.id ? { ...s, verified: !s.verified } : s));
      } else {
        toast.error(data.error || "Action failed");
      }
    } catch { toast.error("Network error"); }
    finally { setActionId(null); }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[26px] font-bold">School management</h1>
        <p className="text-[14px] text-gray-500 mt-0.5">{total} registered schools</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
          <div className="font-display text-[22px] font-bold text-gray-900">{total}</div>
          <div className="text-[12px] text-gray-500">Total schools</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
          <div className="font-display text-[22px] font-bold text-green-600">{schools.filter(s => s.verified).length}</div>
          <div className="text-[12px] text-gray-500">Verified</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
          <div className="font-display text-[22px] font-bold text-amber-500">{schools.filter(s => !s.verified).length}</div>
          <div className="text-[12px] text-gray-500">Pending verification</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-[13.5px] bg-white focus:outline-none focus:border-brand-500"
            placeholder="Search school or city..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-[13.5px] bg-white focus:outline-none focus:border-brand-500"
          value={verifiedFilter}
          onChange={(e) => { setVerifiedFilter(e.target.value); setPage(1); }}
        >
          <option value="">All schools</option>
          <option value="true">Verified only</option>
          <option value="false">Unverified only</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><Loader2 size={20} className="animate-spin text-gray-400 mx-auto" /></div>
        ) : schools.length === 0 ? (
          <div className="p-10 text-center text-[14px] text-gray-400">No schools found</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {schools.map((school) => (
              <div key={school.id} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[14px] font-semibold truncate">{school.schoolName || <span className="text-gray-400 italic">Unnamed school</span>}</p>
                    {school.verified && <BadgeCheck size={14} className="text-brand-500 shrink-0" />}
                  </div>
                  <p className="text-[12.5px] text-gray-500">
                    {school.city || "—"} · {getBoardLabel(school.board)} · {school._count.jobPostings} job{school._count.jobPostings !== 1 ? "s" : ""} · {school.user.email} · Joined {timeAgo(school.user.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {actionId === school.id ? (
                    <Loader2 size={16} className="animate-spin text-gray-400 mx-2" />
                  ) : (
                    <button
                      onClick={() => toggleVerify(school)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                        school.verified
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : "bg-green-50 text-green-700 hover:bg-green-100"
                      }`}
                    >
                      {school.verified
                        ? <><ShieldOff size={13} /> Remove verification</>
                        : <><BadgeCheck size={13} /> Verify school</>
                      }
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 25 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-[13px] text-gray-500">Showing {Math.min((page - 1) * 25 + 1, total)}–{Math.min(page * 25, total)} of {total}</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg text-[13px] border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
            <button disabled={page * 25 >= total} onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg text-[13px] border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
