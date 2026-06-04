import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

function buildContentSecurityPolicy() {
  const posthogOrigins = (() => {
    try {
      const apiOrigin = new URL(posthogHost).origin;
      const assetOrigin = apiOrigin.replace(".i.posthog.com", "-assets.i.posthog.com");
      return { apiOrigin, assetOrigin };
    } catch {
      return {
        apiOrigin: "https://us.i.posthog.com",
        assetOrigin: "https://us-assets.i.posthog.com",
      };
    }
  })();

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src 'self' 'unsafe-inline' ${isProduction ? "" : "'unsafe-eval'"} ${posthogOrigins.apiOrigin} ${posthogOrigins.assetOrigin}`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co https://ui-avatars.com https://i.pravatar.cc",
    "font-src 'self' data:",
    "media-src 'self' blob: https://*.supabase.co",
    `connect-src 'self' https://*.supabase.co ${posthogOrigins.apiOrigin} ${posthogOrigins.assetOrigin}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "frame-src 'none'",
    "child-src 'none'",
    isProduction ? "upgrade-insecure-requests" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
    ],
  },
  async headers() {
    const headers = [
      {
        key: "Content-Security-Policy",
        value: buildContentSecurityPolicy(),
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
      },
      {
        key: "Cross-Origin-Resource-Policy",
        value: "same-site",
      },
    ];

    if (isProduction) {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload",
      });
    }

    return [
      {
        source: "/:path*",
        headers,
      },
    ];
  },
};

export default nextConfig;
