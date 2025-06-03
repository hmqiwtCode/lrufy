import { LRUCache, EvictionReason } from "./index";

/**
 * Basic usage example
 */
function basicExample() {
  const cache = new LRUCache<string, number>({ max: 100 });

  cache.set("one", 1);
  cache.set("two", 2);
  cache.set("three", 3);

  console.log("Get one:", cache.get("one")); // 1
  console.log("Get missing:", cache.get("missing")); // undefined

  console.log("Has two:", cache.has("two")); // true

  cache.delete("two");
  console.log("Has two after delete:", cache.has("two")); // false

  cache.clear();
  console.log("Cache size after clear:", cache.size); // 0
}

/**
 * TTL example
 */
function ttlExample() {
  const cache = new LRUCache<string, object>({
    ttl: 5000,
    allowStale: true,
  });

  cache.set("defaultTTL", { value: "expires in 5 seconds" });

  cache.set("customTTL", { value: "expires in 1 second" }, { ttl: 1000 });

  console.log("Just added - defaultTTL exists:", cache.has("defaultTTL")); // true
  console.log("Just added - customTTL exists:", cache.has("customTTL")); // true

  setTimeout(() => {
    console.log("After 2s - defaultTTL exists:", cache.has("defaultTTL")); // true
    console.log("After 2s - customTTL exists:", cache.has("customTTL")); // false (expired)

    console.log("Stale value:", cache.get("customTTL")); // { value: 'expires in 1 second' }
  }, 2000);
}

/**
 * Custom size calculation example
 */
function sizeCalculationExample() {
  const cache = new LRUCache<string, Buffer>({
    maxSize: 10 * 1024 * 1024, // 10MB
    sizeCalculation: (value) => value.length, // Size is the buffer length
  });

  const item1 = Buffer.alloc(1 * 1024 * 1024); // 1MB
  const item2 = Buffer.alloc(5 * 1024 * 1024); // 5MB
  const item3 = Buffer.alloc(6 * 1024 * 1024); // 6MB

  cache.set("item1", item1);
  cache.set("item2", item2);

  console.log("Total size before adding item3:", cache.getStats().totalSize); // ~6MB

  cache.set("item3", item3);

  console.log("Has item1 after adding item3:", cache.has("item1")); // false (evicted)
  console.log("Cache stats:", cache.getStats());
}

/**
 * Dispose callback example
 */
function disposeExample() {
  const connections: Record<string, { close: () => void }> = {};

  const connectionCache = new LRUCache<string, string>({
    max: 5,
    dispose: (value, key, reason) => {
      console.log(`Connection ${key} was removed because: ${reason}`);

      if (connections[key]) {
        connections[key].close();
        delete connections[key];
      }
    },
  });

  for (let i = 1; i <= 7; i++) {
    const key = `conn${i}`;

    connections[key] = {
      close: () => console.log(`Connection ${key} closed`),
    };

    connectionCache.set(key, `connection-${i}`);
  }
}

/**
 * Serialization example
 */
function serializationExample() {
  const originalCache = new LRUCache<string, number>();
  originalCache.set("one", 1);
  originalCache.set("two", 2);

  const serialized = originalCache.serialize();
  console.log("Serialized cache:", serialized);

  const newCache = new LRUCache<string, number>();
  newCache.deserialize(serialized);

  console.log("Deserialized cache has one:", newCache.has("one")); // true
  console.log("Deserialized cache get two:", newCache.get("two")); // 2
}

console.log("===== BASIC EXAMPLE =====");
basicExample();

console.log("\n===== TTL EXAMPLE =====");
ttlExample();

console.log("\n===== SIZE CALCULATION EXAMPLE =====");
sizeCalculationExample();

console.log("\n===== DISPOSE EXAMPLE =====");
disposeExample();

console.log("\n===== SERIALIZATION EXAMPLE =====");
serializationExample();
