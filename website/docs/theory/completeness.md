---
sidebar_position: 1
title: Completeness
---

# Completeness

Completeness is the central formal property of the Spec Graph. It answers the question: **does this specification contain enough information for deterministic manifestation?**

## Definition

A Spec Graph G is **complete** with respect to implementing agent A if, for any two manifestations M₁ and M₂ that A could produce from G:

```
∀ M₁, M₂ ∈ Manifest(G, A):  M₁ ≡ M₂
```

Intuitively: no matter how many times you manifest from the same spec, you get the "same" system. The agent has no ambiguous decisions left to make on dimensions the designer cares about.

## What "Equivalent" Means

Equivalence is **parameterized by the node types present in the graph**:

| Nodes Present | Equivalence Includes |
|---|---|
| behavior only | Same observable behavior |
| + decision | Same architectural structure and technology choices |
| + domain | Same data model and business rules |
| + constraint | Same non-functional characteristics |
| All core types | Approaches total equivalence |

A graph with only behavior nodes guarantees behavioral equivalence — two manifestations do the same things, but may be structured completely differently. Adding decision nodes narrows the architecture. Adding domain nodes aligns the data model. Each additional dimension tightens the equivalence relation.

## Practical Implications

Perfect completeness requires that the spec determines **every** decision. In practice, this is neither achievable nor desirable — some decisions (variable names, exact file structure, import ordering) don't affect the designer's intent.

The practical goal is:

> **The remaining unspecified decisions do not violate the designer's intent.**

A spec graph is "complete enough" when the implementing agent's remaining choices are all in the category of irrelevant implementation details — things the designer genuinely doesn't care about.

## Completeness and the Agent

Completeness is defined **relative to an implementing agent**. A less capable agent may need more specification to produce deterministic results. A more capable agent (one with better judgment about conventions, patterns, and best practices) may need less.

The Spec Graph aims to be complete enough for a **competent implementing agent** — one that understands the target language, frameworks, and common conventions, but has no special knowledge of this particular system's design intent.

## Relationship to Manifestation

Completeness is the precondition for deterministic manifestation:

```
Complete(G) ∧ Capable(A) → Deterministic(Manifest(G, A))
```

Where `Capable(A)` means the agent can parse the graph, resolve dependencies, apply guidance, respect constraints, and verify outcomes. See [Manifestation](/docs/manifestation/overview) for how agents process a complete graph.
