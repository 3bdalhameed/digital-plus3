#!/bin/sh
set -e

# Prisma schema reads DATABASE_URL; fall back to CMS_DATABASE_URL if unset
export DATABASE_URL="${DATABASE_URL:-$CMS_DATABASE_URL}"

# Create / migrate tables (idempotent — safe to run on every start)
pnpm exec prisma db push --skip-generate

exec pnpm start
