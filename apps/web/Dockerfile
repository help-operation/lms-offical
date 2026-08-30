# ---- Build stage ----
FROM node:20-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends python3 build-essential \
  && rm -rf /var/lib/apt/lists/*
RUN npm i -g pnpm@9
WORKDIR /repo

# Workspace manifests first (better layer caching)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages ./packages
COPY apps/web ./apps/web

RUN pnpm install --frozen-lockfile

# NEXT_PUBLIC_* vars are baked into the client bundle at build time —
# they must be passed as build args, not just runtime env vars.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_WHATSAPP_URL
ARG NEXT_PUBLIC_MESSENGER_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_WHATSAPP_URL=$NEXT_PUBLIC_WHATSAPP_URL \
    NEXT_PUBLIC_MESSENGER_URL=$NEXT_PUBLIC_MESSENGER_URL

RUN pnpm --filter @repo/validators build
RUN pnpm --filter web exec next build

# ---- Runtime stage ----
# next.config.js has output: "standalone", so the build produces a
# self-contained server at .next/standalone (its own node_modules subset).
FROM node:20-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/public ./apps/web/public

EXPOSE 3000
ENV PORT=3000
# Docker auto-sets HOSTNAME to the container ID, which the standalone
# server.js uses as its bind address (server.js: hostname = process.env.HOSTNAME || 'localhost'),
# causing it to listen on loopback only instead of all interfaces.
ENV HOSTNAME="0.0.0.0"
CMD ["node", "apps/web/server.js"]
