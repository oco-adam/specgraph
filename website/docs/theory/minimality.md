---
sidebar_position: 2
title: Minimality
---

# Minimality

Minimality is the counterpart to completeness. Where completeness asks "is there enough?", minimality asks "is there too much?"

## Definition

A Spec Graph G is **minimal** if removing any node would break completeness — that is, would allow the implementing agent to make a choice the designer wouldn't want:

```
∀ node n ∈ G:
  ∃ M₁, M₂ ∈ Manifest(G \ {n}, A):
    M₁ ≢ M₂
```

In plain English: every node in the graph is **load-bearing**. If you can remove a node and still get predictable manifestation, that node was redundant and shouldn't be there.

## The Basis Analogy

Minimality is analogous to a **basis** in linear algebra — the minimal set of vectors that spans the space. The Spec Graph is the minimal set of specifications that spans the designer's "intent space."

Just as a redundant vector in a basis can be expressed as a combination of the others, a redundant node in the graph can be derived from the remaining nodes (or simply doesn't affect manifestation).

## The Minimality Test

For any proposed spec node, ask:

> "If I removed this, could a competent implementing agent make a choice I wouldn't want?"

- **If yes** → the node is load-bearing, keep it
- **If no** → the node is redundant, remove it

This test should be applied regularly during spec authoring to keep the graph lean.

## Why Minimality Matters

### Cognitive Load

Every node in the graph is something an implementing agent (or human reviewer) must read, understand, and respect. Redundant nodes waste attention and create opportunities for contradiction.

### Contradiction Risk

Redundant nodes can drift out of sync with the nodes they duplicate. When two nodes say the same thing in different words, they will eventually disagree — and the agent must decide which one to follow.

### Signal-to-Noise Ratio

A minimal graph has maximum signal. Every node you read changes your understanding of the system. In a non-minimal graph, many nodes are noise — they don't tell you anything you couldn't derive from other nodes.

## What Minimality Is Not

Minimality does **not** mean brevity. A 200-node graph can be minimal if every node is load-bearing. A 5-node graph can be non-minimal if one node is redundant.

Minimality also does not mean "omit things the agent can figure out." It means "omit things where the agent's guess would always match the designer's intent." If there's any risk of divergence, the node is load-bearing.

## Relationship to Progressive Adoption

Minimality supports [progressive adoption](/docs/guides/progressive-adoption). You start with a small graph (behavior nodes only) and add nodes only when the minimality test demands it. This means the graph grows organically in response to actual manifestation ambiguity, not speculatively.
