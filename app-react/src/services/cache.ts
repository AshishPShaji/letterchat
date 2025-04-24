// Simple cache implementation for API responses
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // in milliseconds
}

interface CacheOptions {
  expiresIn?: number; // in milliseconds, default 5 minutes
}

class ApiCache {
  private cache: Map<string, CacheEntry<unknown>>;
  private defaultExpiryTime: number = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor() {
    this.cache = new Map();
  }

  // Get data from cache if valid, otherwise return null
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if cache entry has expired
    if (Date.now() - entry.timestamp > entry.expiresIn) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  // Set data in cache with options
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const expiresIn = options.expiresIn || this.defaultExpiryTime;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn,
    });
  }

  // Remove a specific item from cache
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  // Invalidate multiple cache entries by prefix
  invalidateByPrefix(prefix: string): void {
    // Convert to array first to avoid iterator issues
    const keys = Array.from(this.cache.keys());
    
    for (const key of keys) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }

  // Get cache size
  get size(): number {
    return this.cache.size;
  }
}

// Singleton instance
export const apiCache = new ApiCache(); 