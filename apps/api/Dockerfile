# ---- Build stage ----
FROM node:20-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends python3 build-essential \
  && rm -rf /var/lib/apt/lists/*
RUN npm i -g pnpm@9
WORKDIR /repo

# Workspace manifests first (better layer caching)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @repo/validators build
RUN pnpm --filter api exec nest build

# ---- Runtime stage ----
FROM node:20-slim AS runtime
RUN npm i -g pnpm@9
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=build /repo /repo
WORKDIR /repo/apps/api
EXPOSE 3000

# Run pending DB migrations (HTTP driver, not drizzle-kit), then boot the API.
# tsc emits to dist/src/** because there are .ts files at the apps/api root.
CMD ["sh", "-c", "node dist/src/db/migrate.js && node dist/src/main.js"]
