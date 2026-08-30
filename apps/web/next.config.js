/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // cacheComponents (Partial Prerendering) removed: with it on, any route
  // with a loading.tsx over uncached dynamic data (checkout, etc.) gets
  // prerendered as a static shell + a "postponed" stream for the rest.
  // That resume mechanism only works behind Vercel's edge — self-hosted
  // (Coolify/Docker behind nginx+Cloudflare) can't resume it, so a Server
  // Action POST to one of those routes (createLeadAction, initiatePayment)
  // got served the shell HTML back instead of running, surfacing as
  // "An unexpected response was received from the server". There is no
  // per-route opt-out in Next 16 (`dynamic`/`experimental_ppr` were both
  // removed), so all `"use cache"` call sites were converted back to plain
  // `fetch(..., { next: { revalidate, tags } })` calls instead.
  //
  // Self-hosted behind nginx (TLS terminated at the proxy, app runs over
  // plain HTTP on 127.0.0.1). Without this, Next.js's Server Action
  // same-origin check computes the expected origin as http://leerney.com
  // while the browser sends https://leerney.com, rejecting every action
  // (createLeadAction, initiatePayment, etc.) with a generic
  // "unexpected response" error that only reproduces in production.
  experimental: {
    serverActions: {
      allowedOrigins: ["leerney.com", "www.leerney.com"],
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "pub-*.r2.dev" },
      { protocol: "https", hostname: "image.mux.com" },
      { protocol: "https", hostname: "*.cloudflare.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      // Allow any HTTPS host for user-provided blog thumbnails
      { protocol: "https", hostname: "**" },
      { protocol: "http",  hostname: "**" },
    ],
  },
};

export default nextConfig;
