FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache openssl
RUN npm install -g pnpm@9

# Copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/storefront/ ./apps/storefront/

# Install all deps (dev deps needed for prisma CLI + next build)
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Generate Prisma client (retry on network flakiness)
RUN --mount=type=cache,id=prisma-binaries,target=/root/.cache/prisma \
    for i in 1 2 3 4 5; do \
      pnpm --filter=storefront exec prisma generate && break; \
      echo "prisma generate attempt $i failed, retrying in 20s..."; \
      sleep 20; \
    done

# Build Next.js — cache webpack/SWC artifacts to speed up subsequent builds
RUN --mount=type=cache,id=nextjs-cache,target=/app/apps/storefront/.next/cache \
    NEXT_TELEMETRY_DISABLED=1 pnpm --filter=storefront build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

WORKDIR /app/apps/storefront
EXPOSE 3000

# Use DATABASE_URL if set, otherwise fall back to CMS_DATABASE_URL.
# prisma db push creates tables idempotently on every start.
CMD ["sh", "-c", "export DATABASE_URL=${DATABASE_URL:-$CMS_DATABASE_URL} && pnpm exec prisma migrate deploy && exec pnpm start"]
