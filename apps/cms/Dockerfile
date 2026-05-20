FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@9

# Copy workspace manifests (layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/cms/ ./apps/cms/

# Install all deps
RUN pnpm install --frozen-lockfile

# Build (payload build + tsc)
RUN pnpm --filter=cms build

# ── Runtime stage ───────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

RUN npm install -g pnpm@9

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/cms/package.json ./apps/cms/

# Copy node_modules from builder (avoids re-downloading native binaries)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/cms/node_modules ./apps/cms/node_modules

# Copy built dist from builder
COPY --from=builder /app/apps/cms/dist ./apps/cms/dist

ENV NODE_ENV=production
ENV PAYLOAD_CONFIG_PATH=dist/payload.config.js

WORKDIR /app/apps/cms
EXPOSE 3001
CMD ["node", "dist/server.js"]
