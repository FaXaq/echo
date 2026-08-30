# Build from the monorepo root: docker build -f apps/cli/Dockerfile .
FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app

FROM base AS pruner
COPY . .
RUN npx turbo prune @echo/cli --docker

FROM base AS builder
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo build --filter=@echo/cli

FROM base AS runner
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 cli
USER cli
COPY --from=builder --chown=cli:nodejs /app .

WORKDIR /app/apps/cli
ENTRYPOINT ["node_modules/.bin/tsx", "src/main.ts"]
CMD ["db", "migrate"]
