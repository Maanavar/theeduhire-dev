"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { SchoolAnalytics } from "@/types";

interface SchoolAnalyticsProps {
  data: SchoolAnalytics;
}

export function SchoolAnalytics({ data }: SchoolAnalyticsProps) {
  // Handle empty or sparse data gracefully
  const hasTrendData = data.trend && data.trend.length > 0 && data.trend.some(d => d.applications > 0);
  const hasJobPerformanceData = data.jobPerformance && data.jobPerformance.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Trend Chart — Applications Over Time */}
      <div className="card p-6">
        <h3 className="font-display text-base font-semibold text-gray-900 mb-4">
          Applications Trend (30 days)
        </h3>
        {!hasTrendData ? (
          <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
            No applications yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.trend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1f9b63" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1f9b63" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "rgba(0,0,0,0.4)", fontFamily: "Plus Jakarta Sans" }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getDate()}/${date.getMonth() + 1}`;
                }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "rgba(0,0,0,0.4)", fontFamily: "Plus Jakarta Sans" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: "12px",
                  padding: "12px",
                  fontFamily: "Plus Jakarta Sans",
                  fontSize: "13px",
                }}
                cursor={{ strokeDasharray: "3 3" }}
              />
              <Area
                type="monotone"
                dataKey="applications"
                stroke="#1f9b63"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorApplications)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Job Performance Chart — Per-Job Stats */}
      <div className="card p-6">
        <h3 className="font-display text-base font-semibold text-gray-900 mb-4">
          Job Performance
        </h3>
        {!hasJobPerformanceData ? (
          <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
            No jobs posted yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.jobPerformance} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis
                dataKey="title"
                tick={{ fontSize: 11, fill: "rgba(0,0,0,0.4)", fontFamily: "Plus Jakarta Sans" }}
                tickFormatter={(value) => {
                  // Truncate long titles
                  if (value && value.length > 14) {
                    return value.substring(0, 14) + "...";
                  }
                  return value || "";
                }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "rgba(0,0,0,0.4)", fontFamily: "Plus Jakarta Sans" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: "12px",
                  padding: "12px",
                  fontFamily: "Plus Jakarta Sans",
                  fontSize: "13px",
                }}
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "20px", fontFamily: "Plus Jakarta Sans" }}
                iconType="square"
              />
              <Bar
                dataKey="applicationCount"
                fill="#2a7a4e"
                name="Applications"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
              <Bar
                dataKey="shortlistedCount"
                fill="#f59e0b"
                name="Shortlisted"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
              <Bar
                dataKey="hiredCount"
                fill="#10b981"
                name="Hired"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
