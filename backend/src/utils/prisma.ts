import { PrismaClient as MainPrismaClient } from '@prisma/client';
import { PrismaClient as LocalPrismaClient } from '../../prisma/generated/local-client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: MainPrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __prismaLocal: LocalPrismaClient | undefined;
}

export const prisma = global.__prisma || new MainPrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export const prismaLocal = global.__prismaLocal || new LocalPrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
  global.__prismaLocal = prismaLocal;
}
