// Shared utility functions

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind class merger (shadcn pattern)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format salary range: ₹45K – ₹65K/mo
export function formatSalary(min?: number | null, max?: number | null): string {
  if (!min && !max) return "Not disclosed";
  const fmt = (n: number) => `₹${(n / 1000).toFixed(0)}K`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}/mo`;
  if (min) return `From ${fmt(min)}/mo`;
  return `Up to ${fmt(max!)}/mo`;
}

// Relative time: "2 days ago", "Just now"
export function timeAgo(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterdayStr = new Date(now.getTime() - 86400000).toDateString();

  if (d.toDateString() === todayStr) return "Today";
  if (d.toDateString() === yesterdayStr) return "Yesterday";

  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// Slug generator for SEO URLs
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Human-readable board label from enum value
const BOARD_LABELS: Record<string, string> = {
  CBSE: "CBSE",
  ICSE: "ICSE",
  STATE_BOARD: "State Board",
  IB: "IB",
  CAMBRIDGE: "Cambridge",
  OTHER: "Other",
};
export function getBoardLabel(board: string): string {
  return BOARD_LABELS[board] ?? board;
}
