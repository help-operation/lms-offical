/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // jsPDF's fflate dependency has a `new Worker(<dynamic>)` call that Turbopack
  // tries (and fails) to statically resolve when bundled — treating it as an
  // external keeps it a plain runtime require() and avoids that build error.
  serverExternalPackages: ["jspdf", "fflate"],
  // Self-hosted behind nginx (TLS terminated at the proxy, app runs over
  // plain HTTP on 127.0.0.1) — see apps/web/next.config.js for why this is
  // required for Server Actions to work in production.
  experimental: {
    serverActions: {
      allowedOrigins: ["admin.leerney.com"],
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "pub-*.r2.dev" },
      { protocol: "https", hostname: "image.mux.com" },
    ],
  },
};

export default nextConfig;
