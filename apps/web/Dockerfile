# syntax=docker/dockerfile:1
# Build from the monorepo root: docker build -f apps/web/Dockerfile .
FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app

FROM base AS pruner
COPY . .
RUN npx turbo prune @echo/web --docker

FROM base AS builder
ARG VITE_API_URL
ARG VITE_PUBLIC_POSTHOG_PROJECT_TOKEN
ARG VITE_PUBLIC_POSTHOG_HOST
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_PUBLIC_POSTHOG_PROJECT_TOKEN=$VITE_PUBLIC_POSTHOG_PROJECT_TOKEN
ENV VITE_PUBLIC_POSTHOG_HOST=$VITE_PUBLIC_POSTHOG_HOST
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
COPY lingui.config.js ./lingui.config.js
RUN pnpm turbo build --filter=@echo/web

ARG RELEASE_VERSION
ARG POSTHOG_CLI_PROJECT_ID
ARG POSTHOG_CLI_HOST
RUN --mount=type=secret,id=posthog_cli_api_key \
  if [ -s /run/secrets/posthog_cli_api_key ]; then \
    npm install -g @posthog/cli && \
    POSTHOG_CLI_API_KEY="$(cat /run/secrets/posthog_cli_api_key)" posthog-cli sourcemap inject --directory apps/web/dist && \
    POSTHOG_CLI_API_KEY="$(cat /run/secrets/posthog_cli_api_key)" posthog-cli sourcemap upload --directory apps/web/dist --release-version "$RELEASE_VERSION" && \
    find apps/web/dist -name '*.map' -delete; \
  else \
    echo "Skipping PostHog source map upload: no posthog_cli_api_key secret provided"; \
  fi

FROM nginx:alpine AS runner
RUN apk add --no-cache curl
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
