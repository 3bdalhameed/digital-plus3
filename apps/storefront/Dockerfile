FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl
RUN npm install -g pnpm@9

# Copy workspace manifests (layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/storefront/ ./apps/storefront/

# Install all deps
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Generate Prisma client (cache binary; retry on network flakiness)
RUN --mount=type=cache,id=prisma-binaries,target=/root/.cache/prisma \
    for i in 1 2 3 4 5; do \
      pnpm --filter=storefront exec prisma generate && break; \
      echo "prisma generate attempt $i failed, retrying in 20s..."; \
      sleep 20; \
    done

# Build Next.js
RUN pnpm --filter=storefront build

# ── Runtime stage ───────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache openssl
RUN npm install -g pnpm@9

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/storefront/package.json ./apps/storefront/
COPY apps/storefront/prisma/ ./apps/storefront/prisma/

# Copy node_modules from builder (includes Prisma engines — avoids re-downloading)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/storefront/node_modules ./apps/storefront/node_modules

# Copy built app
COPY --from=builder /app/apps/storefront/.next ./apps/storefront/.next

ENV NODE_ENV=production

WORKDIR /app/apps/storefront
EXPOSE 3000
CMD ["pnpm", "start"]
