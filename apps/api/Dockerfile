# Build from the monorepo root: docker build -f apps/api/Dockerfile .
FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app

FROM base AS pruner
COPY . .
RUN npx turbo prune @echo/api --docker

FROM base AS builder
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo build --filter=@echo/api

FROM base AS runner
RUN apk add --no-cache curl
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 api
USER api
COPY --from=builder --chown=api:nodejs /app .

WORKDIR /app/apps/api
EXPOSE 3000
CMD ["node", "dist/server.js"]
