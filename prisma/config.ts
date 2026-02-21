import type { PrismaConfig } from 'prisma';

// Prisma 7 configuration for D1
// The D1 adapter is passed directly to PrismaClient at runtime
export default {
  earlyAccess: true,
} satisfies PrismaConfig;
