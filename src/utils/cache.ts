/**
 * Caching utilities for the Magic Benchmarking framework
 * Provides in-memory and persistent caching mechanisms
 */

/**
 * Cache entry with expiration
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

/**
 * In-memory cache with TTL support
 */
export class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL: number;

  constructor(defaultTTL = 5 * 60 * 1000) {
    // 5 minutes default
    this.defaultTTL = defaultTTL;
  }

  /**
   * Set a value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTL,
    };
    this.cache.set(key, entry);
  }

  /**
   * Get a value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    expired: number;
    hitRate: number;
    totalRequests: number;
    hits: number;
    misses: number;
  } {
    const expired = this.cleanup();
    return {
      size: this.cache.size,
      expired,
      hitRate: 0, // Would need to track hits/misses for this
      totalRequests: 0,
      hits: 0,
      misses: 0,
    };
  }
}

/**
 * Persistent cache using file system
 */
export class FileCache<T> {
  private cacheDir: string;
  private defaultTTL: number;

  constructor(cacheDir = './cache', defaultTTL = 60 * 60 * 1000) {
    // 1 hour default
    this.cacheDir = cacheDir;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Set a value in persistent cache
   */
  async set(key: string, value: T, ttl?: number): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');

    // Ensure cache directory exists
    await fs.mkdir(this.cacheDir, { recursive: true });

    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTL,
    };

    const filePath = path.join(this.cacheDir, `${this.sanitizeKey(key)}.json`);
    await fs.writeFile(filePath, JSON.stringify(entry, null, 2));
  }

  /**
   * Get a value from persistent cache
   */
  async get(key: string): Promise<T | undefined> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');

      const filePath = path.join(this.cacheDir, `${this.sanitizeKey(key)}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      const entry: CacheEntry<T> = JSON.parse(content);

      // Check if expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        await this.delete(key);
        return undefined;
      }

      return entry.value;
    } catch {
      return undefined;
    }
  }

  /**
   * Check if key exists and is not expired
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined;
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');

      const filePath = path.join(this.cacheDir, `${this.sanitizeKey(key)}.json`);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear all cache files
   */
  async clear(): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const files = await fs.readdir(this.cacheDir);

      await Promise.all(
        files
          .filter((file) => file.endsWith('.json'))
          .map((file) => fs.unlink(`${this.cacheDir}/${file}`))
      );
    } catch {
      // Directory might not exist
    }
  }

  /**
   * Sanitize cache key for file system
   */
  private sanitizeKey(key: string): string {
    return key.replace(/[^a-z0-9.-]/gi, '_');
  }
}

/**
 * Memoization decorator with cache
 */
export function memoizeWithCache<T extends (...args: Parameters<T>) => ReturnType<T>>(
  cache: MemoryCache<ReturnType<T>>,
  keyFn?: (...args: Parameters<T>) => string
) {
  return function (_target: unknown, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: Parameters<T>) {
      const key = keyFn ? keyFn(...args) : `${propertyName}_${JSON.stringify(args)}`;

      // Check cache first
      const cached = cache.get(key);
      if (cached !== undefined) {
        return cached;
      }

      // Execute and cache result
      const result = originalMethod.apply(this, args);
      cache.set(key, result);
      return result;
    };
  };
}

/**
 * Cache manager for coordinating multiple caches
 */
export class CacheManager {
  private caches = new Map<string, MemoryCache<unknown> | FileCache<unknown>>();

  /**
   * Register a cache
   */
  register<T>(name: string, cache: MemoryCache<T> | FileCache<T>): void {
    this.caches.set(name, cache);
  }

  /**
   * Get a registered cache
   */
  get<T>(name: string): MemoryCache<T> | FileCache<T> | undefined {
    return this.caches.get(name) as MemoryCache<T> | FileCache<T> | undefined;
  }

  /**
   * Clear all registered caches
   */
  async clearAll(): Promise<void> {
    const clearPromises = Array.from(this.caches.values()).map((cache) => {
      if (cache instanceof MemoryCache) {
        cache.clear();
        return Promise.resolve();
      } else {
        return (cache as FileCache<unknown>).clear();
      }
    });

    await Promise.all(clearPromises);
  }

  /**
   * Cleanup all memory caches
   */
  cleanupAll(): number {
    let totalCleaned = 0;

    for (const cache of this.caches.values()) {
      if (cache instanceof MemoryCache) {
        totalCleaned += cache.cleanup();
      }
    }

    return totalCleaned;
  }
}

/**
 * Global cache manager instance
 */
export const globalCacheManager = new CacheManager();

/**
 * Default caches
 */
export const reportCache = new MemoryCache<unknown>(10 * 60 * 1000); // 10 minutes
export const chartDataCache = new MemoryCache<unknown>(5 * 60 * 1000); // 5 minutes
export const networkDataCache = new MemoryCache<unknown>(5 * 60 * 1000); // 5 minutes

// Register default caches
globalCacheManager.register('reports', reportCache);
globalCacheManager.register('chartData', chartDataCache);
globalCacheManager.register('networkData', networkDataCache);

/**
 * Utility function to create cache key from object
 */
export function createCacheKey(
  prefix: string,
  ...parts: (string | number | boolean | object)[]
): string {
  const keyParts = parts.map((part) => {
    if (typeof part === 'object') {
      return JSON.stringify(part);
    }
    return String(part);
  });

  return `${prefix}_${keyParts.join('_')}`;
}
