import { cache } from 'react';

type CacheOptions = {
  revalidate?: number; // Time in seconds
};

export class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, { data: any; timestamp: number }>;

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  public async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && (!options.revalidate || now - cached.timestamp < options.revalidate * 1000)) {
      return cached.data as T;
    }

    const data = await fetchFn();
    this.cache.set(key, { data, timestamp: now });
    return data;
  }

  public invalidate(key: string): void {
    this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
  }
}

// React cache wrapper for server components
export const createCachedFunction = <T>(
  fn: (...args: any[]) => Promise<T>,
  options: CacheOptions = {}
) => {
  return cache(async (...args: any[]) => {
    const cacheKey = `${fn.name}-${JSON.stringify(args)}`;
    return CacheManager.getInstance().get(cacheKey, () => fn(...args), options);
  });
}; 