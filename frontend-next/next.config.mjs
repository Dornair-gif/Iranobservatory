/** @type {import('next').NextConfig} */

// ---------------------------------------------------------------------------
// HARDCODED BACKEND URL
// We hardcode it (instead of using a Vercel env var) because env vars are
// fragile during preview deployments and cold starts. To switch backend,
// change this constant, commit, push — Vercel redeploys.
// ---------------------------------------------------------------------------
const BACKEND_URL = "https://iran-events-live.preview.emergentagent.com";

const nextConfig = {
  // We expose the backend host to client components via a public env override
  // so the same code works both server-side (ISR fetch) and client-side.
  env: {
    NEXT_PUBLIC_BACKEND_URL: BACKEND_URL,
  },

  // Vercel rewrites: /api/* on the public domain is transparently proxied to
  // the Emergent backend. Browsers see only one origin (iranobservatory.org),
  // so no CORS preflights and no third-party cookie issues.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },

  // Image optimization: allow Emergent + GridFS image hosts
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "iran-events-live.preview.emergentagent.com" },
      { protocol: "https", hostname: "iranobservatory.org" },
      { protocol: "https", hostname: "customer-assets.emergentagent.com" },
      { protocol: "https", hostname: "**.emergentagent.com" },
    ],
  },

  // Use trailing slashes off for cleaner SEO URLs
  trailingSlash: false,

  // Faster builds; static pages still get prerendered
  reactStrictMode: true,
};

export default nextConfig;
