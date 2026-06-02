"use client";

import Image from "next/image";

const FALLBACK_COLORS = [
  "#4338ca", "#0f766e", "#be185d", "#b45309",
  "#0e7490", "#9a3412", "#1d4ed8", "#7c3aed",
];

function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

type Props = {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
};

export function UserAvatar({ name, avatarUrl, size = 32, className = "", style }: Props) {
  const initStr = initials(name || "?");
  const bg = colorFromName(name || "");
  const sz = `${size}px`;

  const base = [
    "inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden",
    className,
  ].join(" ");

  if (avatarUrl) {
    return (
      <span className={base} style={{ width: sz, height: sz, ...style }}>
        <Image
          src={avatarUrl}
          alt={name || "User"}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          unoptimized
        />
      </span>
    );
  }

  return (
    <span
      className={base}
      style={{ width: sz, height: sz, background: bg, fontSize: `${Math.max(10, size * 0.35)}px`, fontWeight: 700, color: "#fff", ...style }}
    >
      {initStr}
    </span>
  );
}
