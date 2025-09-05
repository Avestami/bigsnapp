import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Export repository classes
export * from './repositories/base.repository';
export * from './repositories/user.repository';
export * from './repositories/driver.repository';
export * from './repositories/ride.repository';
export * from './repositories/delivery.repository';
export * from './repositories/wallet.repository';
export * from './repositories/vehicle.repository';
export * from './repositories/payment.repository';
export * from './repositories/review.repository';
export * from './repositories/adminlog.repository';