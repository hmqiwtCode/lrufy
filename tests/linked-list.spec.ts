import { Node, DoublyLinkedList } from "../src/linked-list";

describe("Node", () => {
  test("should create a node with key and value", () => {
    const node = new Node("key1", "value1");
    expect(node.key).toBe("key1");
    expect(node.value).toBe("value1");
    expect(node.prev).toBeNull();
    expect(node.next).toBeNull();
    expect(node.size).toBe(0);
    expect(node.expiry).toBeNull();
  });
});

describe("DoublyLinkedList", () => {
  let list: DoublyLinkedList<string, string>;

  beforeEach(() => {
    list = new DoublyLinkedList<string, string>();
  });

  test("should initialize as empty", () => {
    expect(list.head).toBeNull();
    expect(list.tail).toBeNull();
    expect(list.length).toBe(0);
  });

  describe("addToFront", () => {
    test("should add node to empty list", () => {
      const node = new Node("key1", "value1");
      list.addToFront(node);

      expect(list.head).toBe(node);
      expect(list.tail).toBe(node);
      expect(list.length).toBe(1);
    });

    test("should add node to front of non-empty list", () => {
      const node1 = new Node("key1", "value1");
      const node2 = new Node("key2", "value2");

      list.addToFront(node1);
      list.addToFront(node2);

      expect(list.head).toBe(node2);
      expect(list.head!.next).toBe(node1);
      expect(list.tail).toBe(node1);
      expect(list.tail!.prev).toBe(node2);
      expect(list.length).toBe(2);
    });
  });

  describe("remove", () => {
    test("should remove the only node", () => {
      const node = new Node("key1", "value1");
      list.addToFront(node);
      list.remove(node);

      expect(list.head).toBeNull();
      expect(list.tail).toBeNull();
      expect(list.length).toBe(0);
    });

    test("should remove head node", () => {
      const node1 = new Node("key1", "value1");
      const node2 = new Node("key2", "value2");

      list.addToFront(node1);
      list.addToFront(node2);

      list.remove(node2);

      expect(list.head).toBe(node1);
      expect(list.tail).toBe(node1);
      expect(list.length).toBe(1);
    });

    test("should remove tail node", () => {
      const node1 = new Node("key1", "value1");
      const node2 = new Node("key2", "value2");

      list.addToFront(node1);
      list.addToFront(node2);

      list.remove(node1);

      expect(list.head).toBe(node2);
      expect(list.tail).toBe(node2);
      expect(list.length).toBe(1);
    });

    test("should remove middle node", () => {
      const node1 = new Node("key1", "value1");
      const node2 = new Node("key2", "value2");
      const node3 = new Node("key3", "value3");

      list.addToFront(node1);
      list.addToFront(node2);
      list.addToFront(node3);

      list.remove(node2);

      expect(list.head).toBe(node3);
      expect(list.head!.next).toBe(node1);
      expect(list.tail).toBe(node1);
      expect(list.tail!.prev).toBe(node3);
      expect(list.length).toBe(2);
    });
  });

  describe("moveToFront", () => {
    test("should not change if node is already at front", () => {
      const node1 = new Node("key1", "value1");
      const node2 = new Node("key2", "value2");

      list.addToFront(node1);
      list.addToFront(node2);

      list.moveToFront(node2);

      expect(list.head).toBe(node2);
      expect(list.tail).toBe(node1);
      expect(list.length).toBe(2);
    });

    test("should move tail node to front", () => {
      const node1 = new Node("key1", "value1");
      const node2 = new Node("key2", "value2");

      list.addToFront(node1);
      list.addToFront(node2);

      list.moveToFront(node1);

      expect(list.head).toBe(node1);
      expect(list.head!.next).toBe(node2);
      expect(list.tail).toBe(node2);
      expect(list.tail!.prev).toBe(node1);
      expect(list.length).toBe(2);
    });

    test("should move middle node to front", () => {
      const node1 = new Node("key1", "value1");
      const node2 = new Node("key2", "value2");
      const node3 = new Node("key3", "value3");

      list.addToFront(node1);
      list.addToFront(node2);
      list.addToFront(node3);

      list.moveToFront(node2);

      expect(list.head).toBe(node2);
      expect(list.head!.next).toBe(node3);
      expect(list.head!.next!.next).toBe(node1);
      expect(list.tail).toBe(node1);
      expect(list.length).toBe(3);
    });
  });

  describe("removeTail", () => {
    test("should return null for empty list", () => {
      expect(list.removeTail()).toBeNull();
      expect(list.length).toBe(0);
    });

    test("should remove and return tail node", () => {
      const node1 = new Node("key1", "value1");
      const node2 = new Node("key2", "value2");

      list.addToFront(node1);
      list.addToFront(node2);

      const removed = list.removeTail();

      expect(removed).toBe(node1);
      expect(list.head).toBe(node2);
      expect(list.tail).toBe(node2);
      expect(list.length).toBe(1);
    });

    test("should handle removing the only node", () => {
      const node = new Node("key1", "value1");
      list.addToFront(node);

      const removed = list.removeTail();

      expect(removed).toBe(node);
      expect(list.head).toBeNull();
      expect(list.tail).toBeNull();
      expect(list.length).toBe(0);
    });
  });

  describe("clear", () => {
    test("should clear the list", () => {
      const node1 = new Node("key1", "value1");
      const node2 = new Node("key2", "value2");

      list.addToFront(node1);
      list.addToFront(node2);

      list.clear();

      expect(list.head).toBeNull();
      expect(list.tail).toBeNull();
      expect(list.length).toBe(0);
    });
  });
});
