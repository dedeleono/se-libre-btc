import { prisma } from "@/lib/db";
import { Prisma, PrismaClient } from "@prisma/client";

export async function withTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options: {
    timeout?: number;
    maxWait?: number;
    isolationLevel?: Prisma.TransactionIsolationLevel;
  } = {}
): Promise<T> {
  try {
    return await prisma.$transaction(
      async (tx) => {
        return await fn(tx);
      },
      {
        maxWait: options.maxWait || 50000,
        timeout: options.timeout || 40000,
        isolationLevel: options.isolationLevel || 'ReadCommitted'
      }
    );
  } catch (error) {
    console.error("Transaction error:", error);
    throw error;
  }
} 