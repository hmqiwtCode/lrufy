import { DoublyLinkedList, Node } from "./linked-list";

/**
 * Options for an individual cache item
 */
export interface ItemOptions {
  /**
   * Time-to-live in milliseconds
   */
  ttl?: number;
  /**
   * Size of the item (defaults to 1 if size calculation is not provided)
   */
  size?: number;
}

/**
 * Function to calculate the size of a cached item
 */
export type SizeCalculator<K, V> = (value: V, key: K) => number;

/**
 * Function called when an item is disposed from the cache
 */
export type DisposeCallback<K, V> = (
  value: V,
  key: K,
  reason: EvictionReason
) => void | Promise<void>;

/**
 * Statistics about cache performance
 */
export interface CacheStats {
  /**
   * Total number of items in the cache
   */
  size: number;
  /**
   * Number of successful cache hits
   */
  hits: number;
  /**
   * Number of cache misses
   */
  misses: number;
  /**
   * Total size of all items in the cache (if sizeCalculation is used)
   */
  totalSize: number;
  /**
   * Ratio of hits to total accesses
   */
  hitRate: number;
}

/**
 * Reason an item was evicted from the cache
 */
export enum EvictionReason {
  /**
   * Item was manually deleted
   */
  DELETED = "deleted",
  /**
   * Item was evicted due to capacity constraints
   */
  EVICTED = "evicted",
  /**
   * Item expired due to TTL
   */
  EXPIRED = "expired",
  /**
   * Item was overwritten with a new value
   */
  OVERWRITTEN = "overwritten",
  /**
   * Cache was manually cleared
   */
  CACHE_CLEAR = "clear",
}

/**
 * Options for configuring the LRU cache
 */
export interface LRUCacheOptions<K, V> {
  /**
   * Maximum number of items in the cache
   */
  max?: number;
  /**
   * Maximum size of all items in the cache combined
   */
  maxSize?: number;
  /**
   * Default time-to-live for cache items in milliseconds
   */
  ttl?: number;
  /**
   * Function to calculate the size of items
   */
  sizeCalculation?: SizeCalculator<K, V>;
  /**
   * Function called when an item is disposed
   */
  dispose?: DisposeCallback<K, V> | null;
  /**
   * Whether to not call dispose when an item is overwritten
   */
  noDisposeOnSet?: boolean;
  /**
   * Whether to allow returning stale (expired) items before removing them
   */
  allowStale?: boolean;
  /**
   * How often to check for and remove expired items (ms), disabled if 0
   */
  pruneInterval?: number;
  /**
   * Whether to dispose of items asynchronously
   */
  asyncDispose?: boolean;
}

// Custom type for internal options that includes required fields
interface InternalLRUCacheOptions<K, V> {
  max: number;
  maxSize: number;
  ttl: number;
  sizeCalculation: SizeCalculator<K, V>;
  dispose: DisposeCallback<K, V> | null;
  noDisposeOnSet: boolean;
  allowStale: boolean;
  pruneInterval: number;
  asyncDispose: boolean;
}

/**
 * A fully-featured Least Recently Used (LRU) cache implementation
 * with optional TTL, custom sizing, and event hooks
 */
export class LRUCache<K = string, V = any> {
  private cache: Map<K, Node<K, V>>;
  private list: DoublyLinkedList<K, V>;
  private readonly options: InternalLRUCacheOptions<K, V>;
  private totalSize: number = 0;
  private pruneTimer: NodeJS.Timeout | null = null;
  private hits: number = 0;
  private misses: number = 0;

  /**
   * Creates a new LRU cache instance
   * @param options - Configuration options for the cache
   */
  constructor(options: LRUCacheOptions<K, V> = {}) {
    this.options = {
      max: options.max ?? Infinity,
      maxSize: options.maxSize ?? Infinity,
      ttl: options.ttl ?? 0,
      sizeCalculation: options.sizeCalculation ?? (() => 1),
      dispose: options.dispose ?? null,
      noDisposeOnSet: options.noDisposeOnSet ?? false,
      allowStale: options.allowStale ?? false,
      pruneInterval: options.pruneInterval ?? 0,
      asyncDispose: options.asyncDispose ?? false,
    };

    this.cache = new Map<K, Node<K, V>>();
    this.list = new DoublyLinkedList<K, V>();

    if (this.options.pruneInterval > 0) {
      this.startPruneTimer();
    }
  }

  /**
   * Gets the current size of the cache
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Retrieves an item from the cache
   * @param key - The key to retrieve
   * @returns The cached value or undefined if not found
   */
  get(key: K): V | undefined {
    const node = this.cache.get(key);

    if (!node) {
      this.misses++;
      return undefined;
    }

    const now = Date.now();
    if (node.expiry !== null && node.expiry < now) {
      // Item is expired
      if (this.options.allowStale) {
        this.hits++;
        return node.value;
      } else {
        this.delete(key, EvictionReason.EXPIRED);
        this.misses++;
        return undefined;
      }
    }

    // Move to front of list to mark as most recently used
    this.list.moveToFront(node);
    this.hits++;
    return node.value;
  }

  /**
   * Checks if a key exists in the cache without updating its recency
   * @param key - The key to check
   * @returns True if the key exists and is not expired
   */
  has(key: K): boolean {
    const node = this.cache.get(key);
    if (!node) return false;

    if (node.expiry !== null && node.expiry < Date.now()) {
      if (!this.options.allowStale) {
        return false;
      }
    }

    return true;
  }

  /**
   * Gets an item without updating its recency
   * @param key - The key to retrieve
   * @returns The cached value or undefined if not found
   */
  peek(key: K): V | undefined {
    const node = this.cache.get(key);
    if (!node) return undefined;

    if (node.expiry !== null && node.expiry < Date.now()) {
      if (!this.options.allowStale) {
        return undefined;
      }
    }

    return node.value;
  }

  /**
   * Adds or updates an item in the cache
   * @param key - The key to set
   * @param value - The value to cache
   * @param options - Options for this specific item
   * @returns The cache instance for chaining
   */
  set(key: K, value: V, options: ItemOptions = {}): this {
    const existing = this.cache.get(key);

    if (existing) {
      // Handle disposing of the old value if being overwritten
      if (!this.options.noDisposeOnSet) {
        this.disposeItem(
          existing.key,
          existing.value,
          EvictionReason.OVERWRITTEN
        );
      }

      // Remove from the linked list and update totalSize
      this.list.remove(existing);
      this.totalSize -= existing.size;
    }

    // Calculate TTL for this item
    const ttl = options.ttl ?? this.options.ttl;
    const expiry = ttl > 0 ? Date.now() + ttl : null;

    // Calculate size for this item
    const size = options.size ?? this.options.sizeCalculation(value, key);

    // Create and add the new node
    const node = new Node<K, V>(key, value);
    node.size = size;
    node.expiry = expiry;

    this.list.addToFront(node);
    this.cache.set(key, node);
    this.totalSize += size;

    // Prune if needed
    this.prune();

    return this;
  }

  /**
   * Removes an item from the cache
   * @param key - The key to remove
   * @param reason - The reason for removal (for dispose callback)
   * @returns True if the item was found and removed
   */
  delete(key: K, reason: EvictionReason = EvictionReason.DELETED): boolean {
    const node = this.cache.get(key);
    if (!node) return false;

    this.disposeItem(node.key, node.value, reason);
    this.cache.delete(key);
    this.list.remove(node);
    this.totalSize -= node.size;

    return true;
  }

  /**
   * Clears all items from the cache
   */
  clear(): void {
    // Call dispose on all items if needed
    if (this.options.dispose) {
      for (const [key, node] of this.cache.entries()) {
        this.disposeItem(key, node.value, EvictionReason.CACHE_CLEAR);
      }
    }

    this.cache.clear();
    this.list.clear();
    this.totalSize = 0;
  }

  /**
   * Retrieves cache statistics
   * @returns An object with cache statistics
   */
  getStats(): CacheStats {
    const totalAccesses = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      totalSize: this.totalSize,
      hitRate: totalAccesses > 0 ? this.hits / totalAccesses : 0,
    };
  }

  /**
   * Removes all expired items from the cache
   * @returns Number of items pruned
   */
  prune(): number {
    const now = Date.now();
    let pruned = 0;

    // First, remove expired items
    for (const [key, node] of this.cache.entries()) {
      if (node.expiry !== null && node.expiry <= now) {
        this.delete(key, EvictionReason.EXPIRED);
        pruned++;
      }
    }

    // Then enforce size constraints
    while (
      (this.options.max < Infinity && this.cache.size > this.options.max) ||
      (this.options.maxSize < Infinity && this.totalSize > this.options.maxSize)
    ) {
      const node = this.list.removeTail();
      if (!node) break;

      this.cache.delete(node.key);
      this.disposeItem(node.key, node.value, EvictionReason.EVICTED);
      this.totalSize -= node.size;
      pruned++;
    }

    return pruned;
  }

  /**
   * Serializes the cache to a JSON-friendly format
   * @returns An array of entries that can be used to reconstruct the cache
   */
  serialize(): Array<[K, V, ItemOptions]> {
    const result: Array<[K, V, ItemOptions]> = [];

    for (const [key, node] of this.cache.entries()) {
      const options: ItemOptions = {
        size: node.size,
      };

      if (node.expiry !== null) {
        const ttl = node.expiry - Date.now();
        if (ttl > 0) {
          options.ttl = ttl;
        } else if (!this.options.allowStale) {
          continue; // Skip expired items
        }
      }

      result.push([key, node.value, options]);
    }

    return result;
  }

  /**
   * Loads serialized data into the cache
   * @param data - Serialized cache data from serialize()
   * @returns The cache instance for chaining
   */
  deserialize(data: Array<[K, V, ItemOptions]>): this {
    this.clear();

    for (const [key, value, options] of data) {
      this.set(key, value, options);
    }

    return this;
  }

  /**
   * Starts the automatic pruning timer
   */
  private startPruneTimer(): void {
    if (this.pruneTimer) {
      clearInterval(this.pruneTimer);
    }

    this.pruneTimer = setInterval(() => {
      this.prune();
    }, this.options.pruneInterval);

    // Prevent the timer from keeping the process alive
    if (this.pruneTimer.unref) {
      this.pruneTimer.unref();
    }
  }

  /**
   * Handles disposing of an item
   */
  private disposeItem(key: K, value: V, reason: EvictionReason): void {
    if (this.options.dispose === null) return;

    try {
      if (this.options.asyncDispose) {
        Promise.resolve(this.options.dispose(value, key, reason)).catch(
          (err) => {
            console.error("Async dispose error:", err);
          }
        );
      } else {
        this.options.dispose(value, key, reason);
      }
    } catch (e) {
      console.error("Error in dispose callback:", e);
    }
  }
}
