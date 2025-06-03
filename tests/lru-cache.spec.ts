import { LRUCache } from "../src/lru-cache";

describe("LRUCache", () => {
  it("should create a cache with default options", () => {
    const cache = new LRUCache();
    expect(cache.size).toBe(0);
  });
});
