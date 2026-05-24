# Stage 1 — build the Nuxt 3 SSR app.
#
# We use Node 20 alpine because Nuxt 3 needs Node ≥ 18.18 and alpine
# keeps the builder layer small. The build produces `.output/` which
# contains both the Nitro server bundle and the prerendered + static
# client assets.
FROM node:20-alpine AS build-stage

ARG NUXT_PUBLIC_API_BASE_URL=https://api.staging.drillspace.id/api/v1
ARG NUXT_PUBLIC_ANALYTICS_ENABLED=false
ARG NUXT_PUBLIC_ENABLE_PROFILE_EDIT=true
ARG BUILD_VERSION=unknown
ARG BUILD_TIME=unknown

# Expose build-time public envs so Nuxt freezes them into the client
# bundle. Anything in `runtimeConfig.public` that needs to change per
# environment must arrive here, not at runtime, because the values are
# inlined during `nuxt build`.
ENV NUXT_PUBLIC_API_BASE_URL=${NUXT_PUBLIC_API_BASE_URL}
ENV NUXT_PUBLIC_ANALYTICS_ENABLED=${NUXT_PUBLIC_ANALYTICS_ENABLED}
ENV NUXT_PUBLIC_ENABLE_PROFILE_EDIT=${NUXT_PUBLIC_ENABLE_PROFILE_EDIT}

WORKDIR /app

# Install deps first so the layer caches when only source changes.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

RUN npm run build

# Stage 2 — minimal runtime image.
#
# The Nuxt build emits a self-contained Node bundle at
# `.output/server/index.mjs` plus the public assets at `.output/public`.
# We only copy `.output` into the runtime image — node_modules + source
# are not needed at runtime.
FROM node:20-alpine AS production-stage

ARG BUILD_VERSION=unknown
ARG BUILD_TIME=unknown

LABEL maintainer="tecnoduct"
LABEL description="DrillSpace Storefront (Nuxt 3 SSR)"
LABEL version="${BUILD_VERSION}"
LABEL build-time="${BUILD_TIME}"

WORKDIR /app

# tini lets the container forward SIGTERM cleanly to the Node process
# so Traefik rolling deploys don't drop in-flight requests.
# node:20-alpine ships a `node` user at UID 1000 — we reuse it rather
# than creating our own (UID 1000 collision otherwise).
RUN apk --no-cache add tini curl

COPY --from=build-stage --chown=node:node /app/.output /app/.output

ENV NODE_ENV=production
ENV NITRO_PORT=3000
ENV NITRO_HOST=0.0.0.0
ENV APP_VERSION=${BUILD_VERSION}
ENV APP_BUILD_TIME=${BUILD_TIME}

USER node

EXPOSE 3000

# /api/_health doesn't exist by default in Nuxt — Traefik checks the
# port itself, this healthcheck is a belt-and-braces "process is up".
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -sf http://127.0.0.1:3000/ > /dev/null || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", ".output/server/index.mjs"]
