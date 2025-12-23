// ===========================================
// Cliente do Prisma (Singleton)
// ===========================================

import { PrismaClient } from '@prisma/client';
import { config } from './env.js';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: config.server.isDev ? ['query', 'error', 'warn'] : ['error'],
  });

if (config.server.isDev) {
  globalForPrisma.prisma = prisma;
}
