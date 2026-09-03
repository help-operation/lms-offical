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

# Coolify injects runtime env vars via docker-compose, but process.env
# must see them.  The migrate + boot CMD reads DATABASE_URL at runtime.
CMD ["sh", "-c", "echo DATABASE_URL=${DATABASE_URL:+SET} && node dist/src/db/migrate.js && node dist/src/main.js"]
