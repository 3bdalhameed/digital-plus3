import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { __prisma: PrismaClient };
const _dbUrl = process.env.CMS_DATABASE_URL || process.env.DATABASE_URL;

export const prisma =
  globalForPrisma.__prisma ||
  new PrismaClient(_dbUrl ? { datasources: { db: { url: _dbUrl } } } : undefined);

if (process.env.NODE_ENV !== "production") globalForPrisma.__prisma = prisma;
