import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/db';

export class TransactionManager {
  private static instance: TransactionManager;
  private connectionLimit: number = 10;
  private activeConnections: number = 0;
  private queue: Array<() => Promise<void>> = [];
  private isProcessing: boolean = false;

  private constructor() {}

  static getInstance(): TransactionManager {
    if (!TransactionManager.instance) {
      TransactionManager.instance = new TransactionManager();
    }
    return TransactionManager.instance;
  }

  async executeQuery<T>(queryFn: () => Promise<T>): Promise<T> {
    if (this.activeConnections >= this.connectionLimit) {
      return new Promise((resolve, reject) => {
        this.queue.push(async () => {
          try {
            const result = await queryFn();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });
    }

    this.activeConnections++;
    try {
      const result = await queryFn();
      return result;
    } finally {
      this.activeConnections--;
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    while (this.queue.length > 0 && this.activeConnections < this.connectionLimit) {
      const nextQuery = this.queue.shift();
      if (nextQuery) {
        await nextQuery();
      }
    }
    this.isProcessing = false;
  }
} 