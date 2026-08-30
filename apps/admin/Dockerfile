# ---- Build stage ----
FROM node:20-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends python3 build-essential \
  && rm -rf /var/lib/apt/lists/*
RUN npm i -g pnpm@9
WORKDIR /repo

# Workspace manifests first (better layer caching)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages ./packages
COPY apps/admin ./apps/admin

RUN pnpm install --frozen-lockfile

# NEXT_PUBLIC_* vars are baked into the client bundle at build time —
# they must be passed as build args, not just runtime env vars.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WEB_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_WEB_URL=$NEXT_PUBLIC_WEB_URL

RUN pnpm --filter @repo/validators build
# reserved-paths.generated.ts is committed to git (regenerated locally when
# apps/web's routes change) — skip re-running the prebuild script here since
# apps/web isn't part of this image's build context.
RUN pnpm --filter admin exec next build

# ---- Runtime stage ----
# next.config.js has output: "standalone", so the build produces a
# self-contained server at .next/standalone (its own node_modules subset).
FROM node:20-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /repo/apps/admin/.next/standalone ./
COPY --from=build /repo/apps/admin/.next/static ./apps/admin/.next/static

EXPOSE 3000
ENV PORT=3000
# Docker auto-sets HOSTNAME to the container ID, which the standalone
# server.js uses as its bind address (server.js: hostname = process.env.HOSTNAME || 'localhost'),
# causing it to listen on loopback only instead of all interfaces.
ENV HOSTNAME="0.0.0.0"
CMD ["node", "apps/admin/server.js"]
