// Export all utilities from lib directory
export * from './utils';
export { mockPrisma } from './mock-prisma';

// Import PrismaClient
import { PrismaClient } from '@prisma/client';
import { mockPrisma } from './mock-prisma';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Determine if we should use the mock implementation
const USE_MOCK = process.env.USE_MOCK === 'true' || process.env.NODE_ENV === 'development';

// Export the prisma client (real or mock)
export const prisma = USE_MOCK 
  ? (mockPrisma as unknown as PrismaClient)
  : (globalForPrisma.prisma || new PrismaClient({ log: ['query'] }));

// In production, assign to global to prevent multiple instances
if (process.env.NODE_ENV !== 'production' && !USE_MOCK) {
  globalForPrisma.prisma = prisma as PrismaClient;
}