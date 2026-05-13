"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    posthog?: {
      init?: (token: string, config?: Record<string, unknown>) => void;
      identify?: (id: string, properties?: Record<string, unknown>) => void;
      capture?: (event: string, properties?: Record<string, unknown>) => void;
    };
    __SV?: number;
  }
}

export default function PostHogProvider() {
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
    if (!token || typeof window === "undefined") return;
    if (window.posthog?.capture) return;

    const posthog = (window.posthog = window.posthog || ({} as any));
    if (window.__SV) return;

    const queue: any[] = [];
    const methods = [
      "capture",
      "identify",
      "register",
      "register_once",
      "set_config",
      "reset",
      "isFeatureEnabled",
      "getFeatureFlag",
      "reloadFeatureFlags",
      "group",
      "setPersonProperties",
    ];

    methods.forEach((method) => {
      (posthog as any)[method] = (...args: unknown[]) => {
        queue.push([method, ...args]);
      };
    });

    const script = document.createElement("script");
    script.async = true;
    script.src = `${host.replace(/\/$/, "").replace(".i.posthog.com", "-assets.i.posthog.com")}/static/array.js`;
    script.onload = () => {
      if (window.posthog?.init) {
        window.posthog.init(token, { api_host: host, defaults: "2026-01-30" });
        queue.forEach((entry) => {
          const [method, ...args] = entry;
          (window.posthog as any)?.[method]?.(...args);
        });
      }
    };

    document.head.appendChild(script);
    window.__SV = 1;
  }, []);

  return null;
}

