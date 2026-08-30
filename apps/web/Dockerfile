# Build from the monorepo root: docker build -f apps/web/Dockerfile .
FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app

FROM base AS pruner
COPY . .
RUN npx turbo prune @echo/web --docker

FROM base AS builder
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
COPY lingui.config.js ./lingui.config.js
RUN pnpm turbo build --filter=@echo/web

FROM nginx:alpine AS runner
RUN apk add --no-cache curl
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
