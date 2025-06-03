# LRUfy

A feature-rich LRU (Least Recently Used) cache implementation for Node.js and browsers with TypeScript support.

## Features

- **Capacity Management**

  - Limit by item count (`max`)
  - Limit by total size (`maxSize`)
  - Custom size calculation function

- **Time-to-Live (TTL)**

  - Global TTL for all items
  - Per-item TTL configuration
  - Automatic pruning of expired items

- **Eviction Policy**

  - LRU (Least Recently Used) eviction
  - Manual item deletion

- **Serialization**

  - Methods to save and restore cache state

- **Event Hooks**

  - Dispose callbacks when items are removed
  - Async disposal support
  - Control over disposal behavior when items are overwritten

- **Stale Item Handling**
  - Option to return stale items before removal

## Installation

```bash
npm install lrufy
```

## Basic Usage

```typescript
import LRUCache from "lrufy";

const cache = new LRUCache({ max: 1000 });

cache.set("key1", "value1");
cache.set("key2", { complex: "value" });

const value = cache.get("key1"); // 'value1'

const exists = cache.has("key2"); // true

cache.delete("key1");

cache.clear();
```

## Advanced Features

### Time-to-Live (TTL)

```typescript
const cache = new LRUCache({
  ttl: 5 * 60 * 1000, // 5 minutes in milliseconds
  allowStale: true, // Allow returning stale items before removal
});

// Set an item with custom TTL (10 seconds)
cache.set("short-lived", "expires quickly", { ttl: 10 * 1000 });

cache.set("normal", "uses default TTL");

const staleValue = cache.get("expired-but-stale");
```

### Custom Size Calculation

```typescript
// Create a cache with a maximum total size of 10MB
const cache = new LRUCache<string, Buffer>({
  maxSize: 10 * 1024 * 1024,
  sizeCalculation: (value) => value.length, // Calculate size based on buffer length
});

// Add a 2MB buffer
const buffer = Buffer.alloc(2 * 1024 * 1024);
cache.set("large-item", buffer);
```

### Disposal Callbacks

```typescript
const cache = new LRUCache({
  max: 100,
  dispose: (value, key, reason) => {
    console.log(`Item ${key} was removed because: ${reason}`);
    if (value.close) {
      value.close();
    }
  },
  noDisposeOnSet: false, // Call dispose when an item is overwritten
});
```

### Serialization

```typescript
const cache = new LRUCache<string, number>();
cache.set("one", 1);
cache.set("two", 2);

const serialized = cache.serialize();

fs.writeFileSync("cache.json", JSON.stringify(serialized));

const savedData = JSON.parse(fs.readFileSync("cache.json", "utf8"));
const restoredCache = new LRUCache<string, number>();
restoredCache.deserialize(savedData);
```

### Cache Statistics

```typescript
const cache = new LRUCache();

const stats = cache.getStats();
console.log(`Cache size: ${stats.size}`);
console.log(`Hit rate: ${stats.hitRate * 100}%`);
```

## API Reference

### Constructor

```typescript
new LRUCache<K, V>(options?: LRUCacheOptions<K, V>)
```

- `K`: Type for cache keys (defaults to `string`)
- `V`: Type for cached values (defaults to `any`)

### Options

| Option            | Type                           | Default    | Description                                      |
| ----------------- | ------------------------------ | ---------- | ------------------------------------------------ |
| `max`             | `number`                       | `Infinity` | Maximum number of items in the cache             |
| `maxSize`         | `number`                       | `Infinity` | Maximum total size of items                      |
| `ttl`             | `number`                       | `0`        | Default TTL in milliseconds (0 = no expiry)      |
| `sizeCalculation` | `(value, key) => number`       | `() => 1`  | Function to calculate item size                  |
| `dispose`         | `(value, key, reason) => void` | `null`     | Called when an item is removed                   |
| `noDisposeOnSet`  | `boolean`                      | `false`    | If true, don't call dispose when overwriting     |
| `allowStale`      | `boolean`                      | `false`    | If true, return expired items before removal     |
| `pruneInterval`   | `number`                       | `0`        | Interval to auto-prune expired items (ms)        |
| `asyncDispose`    | `boolean`                      | `false`    | If true, handle dispose callbacks asynchronously |

### Methods

- `get(key)`: Get an item (undefined if not found)
- `set(key, value, options?)`: Add or update an item
- `has(key)`: Check if an item exists (non-expired)
- `peek(key)`: Get an item without updating its recency
- `delete(key)`: Remove an item
- `clear()`: Remove all items
- `prune()`: Remove expired items and enforce size constraints
- `serialize()`: Convert cache to serializable format
- `deserialize(data)`: Load cache from serialized data
- `getStats()`: Get cache statistics

## License

MIT
