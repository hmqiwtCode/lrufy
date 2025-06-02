/**
 * Represents a node in a doubly linked list
 */
export class Node<K, V> {
  key: K;
  value: V;
  prev: Node<K, V> | null = null;
  next: Node<K, V> | null = null;
  size: number = 0;
  expiry: number | null = null;

  /**
   * Creates a new node
   * @param key - The key associated with this node
   * @param value - The value stored in this node
   */
  constructor(key: K, value: V) {
    this.key = key;
    this.value = value;
  }
}

/**
 * A doubly linked list implementation to track LRU order
 */
export class DoublyLinkedList<K, V> {
  head: Node<K, V> | null = null;
  tail: Node<K, V> | null = null;
  length: number = 0;

  /**
   * Adds a node to the front of the list (most recently used)
   * @param node - The node to add
   * @returns The added node
   */
  addToFront(node: Node<K, V>): Node<K, V> {
    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      node.next = this.head;
      this.head.prev = node;
      this.head = node;
    }
    this.length++;
    return node;
  }

  /**
   * Removes a node from the list
   * @param node - The node to remove
   * @returns The removed node
   */
  remove(node: Node<K, V>): Node<K, V> {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }

    node.prev = null;
    node.next = null;
    this.length--;

    return node;
  }

  /**
   * Moves a node to the front of the list (marks as recently used)
   * @param node - The node to move to the front
   * @returns The moved node
   */
  moveToFront(node: Node<K, V>): Node<K, V> {
    if (this.head === node) {
      return node;
    }

    this.remove(node);
    return this.addToFront(node);
  }

  /**
   * Removes the least recently used node (from the tail)
   * @returns The removed node or null if the list is empty
   */
  removeTail(): Node<K, V> | null {
    if (!this.tail) return null;
    return this.remove(this.tail);
  }

  /**
   * Clears the linked list
   */
  clear(): void {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }
}
