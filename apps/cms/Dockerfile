FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl
RUN npm install -g pnpm@9

# Copy workspace manifests (layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/cms/ ./apps/cms/

# Install all deps
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# PAYLOAD_PUBLIC_SERVER_URL must be baked into the admin bundle at build time
ARG PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3001
ENV PAYLOAD_PUBLIC_SERVER_URL=$PAYLOAD_PUBLIC_SERVER_URL

ARG COMMIT_SHA=unknown
ENV COMMIT_SHA=$COMMIT_SHA

RUN echo "Building with PAYLOAD_PUBLIC_SERVER_URL=$PAYLOAD_PUBLIC_SERVER_URL commit=$COMMIT_SHA" && pnpm --filter=cms build

# ── Runtime stage ───────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache openssl
RUN npm install -g pnpm@9

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/cms/package.json ./apps/cms/

# Copy node_modules from builder (avoids re-downloading native binaries)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/cms/node_modules ./apps/cms/node_modules

# Copy built dist and admin bundle from builder
COPY --from=builder /app/apps/cms/dist ./apps/cms/dist
COPY --from=builder /app/apps/cms/build ./apps/cms/build

ENV NODE_ENV=production
ENV PAYLOAD_CONFIG_PATH=dist/payload.config.js

WORKDIR /app/apps/cms
EXPOSE 3001
CMD ["node", "dist/server.js"]
