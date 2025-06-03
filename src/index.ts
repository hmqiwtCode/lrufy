/**
 * LRUfy - A feature-rich LRU cache implementation
 *
 * Features:
 * - Capacity management (max items or max total size)
 * - Time-to-live (TTL) support for cache items
 * - LRU eviction policy
 * - Serialization support
 * - Event hooks for item disposal
 * - Stale item handling
 */

export {
  LRUCache,
  LRUCacheOptions,
  ItemOptions,
  SizeCalculator,
  DisposeCallback,
  CacheStats,
  EvictionReason,
} from "./lru-cache";

export { Node, DoublyLinkedList } from "./linked-list";

import { LRUCache } from "./lru-cache";
export default LRUCache;
