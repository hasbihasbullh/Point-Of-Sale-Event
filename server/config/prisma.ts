/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export const disconnectPrisma = async () => {
  try {
    await prisma.$disconnect();
  } catch (err) {
    console.error('Error disconnecting Prisma client:', err);
  }
};
