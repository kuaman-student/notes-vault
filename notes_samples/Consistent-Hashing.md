---
title: "System Design: Consistent Hashing & Virtual Nodes"
category: "System Design"
tags: ["System Design", "Distributed Systems", "Hashing", "DynamoDB"]
difficulty: "Advanced"
---

# Consistent Hashing & Virtual Nodes

In traditional modulo hashing:
$$\\text{serverIndex} = \\text{hash}(\\text{key}) \\pmod N$$

When a server is added or removed ($N \\rightarrow N+1$), almost **100% of keys are remapped**, causing massive cache stampedes and server crashes!

---

## 1. How Consistent Hashing Solves This

1. Map both servers and keys to a circular ring of range $[0, 2^{32} - 1]$.
2. To find which server holds a key, walk **clockwise** on the ring from the key's position until the first server node is reached.
3. When a node is removed or added, only keys in its immediate segment need remapping:
$$\\text{Remapped Keys} \\approx \\frac{K}{N}$$

---

## 2. The Problem of Hotspots & Virtual Nodes

Physical servers may not be distributed evenly along the ring, causing uneven load distribution.

### Solution: Virtual Nodes (Vnodes)
Assign each physical server multiple virtual replica tokens (e.g. 100 to 300 virtual tokens per machine):

```python
import hashlib

class ConsistentHashRing:
    def __init__(self, replicas=100):
        self.replicas = replicas
        self.ring = dict()
        self.sorted_keys = []

    def _hash(self, key):
        return int(hashlib.md5(key.encode('utf-8')).hexdigest(), 16)

    def add_node(self, node):
        for i in range(self.replicas):
            vnode_key = f"{node}#vnode_{i}"
            val = self._hash(vnode_key)
            self.ring[val] = node
            self.sorted_keys.append(val)
        self.sorted_keys.sort()
```
