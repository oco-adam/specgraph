---
sidebar_position: 1
title: Completeness
---

# Completeness

Completeness is the central formal property of the Spec Graph. It answers the question: **does this specification contain enough information for predictable manifestation?**

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
| + policy | Same non-functional characteristics |
| All core types | Approaches total equivalence |

A graph with only behavior nodes guarantees behavioral equivalence — two manifestations do the same things, but may be structured completely differently. Adding decision nodes narrows the architecture. Adding domain nodes aligns the data model. Each additional dimension tightens the equivalence relation.

## Practical Implications

Perfect completeness requires that the spec determines **every** decision. In practice, this is neither achievable nor desirable — some decisions (variable names, exact file structure, import ordering) don't affect the designer's intent.

The practical goal is:

> **The remaining unspecified decisions do not violate the designer's intent.**

A spec graph is "complete enough" when the implementing agent's remaining choices are all in the category of irrelevant implementation details — things the designer genuinely doesn't care about.

## Completeness and the Agent

Completeness is defined **relative to an implementing agent**. A less capable agent may need more specification to produce predictable results. A more capable agent (one with better judgment about conventions, patterns, and best practices) may need less.

The Spec Graph aims to be complete enough for a **competent implementing agent** — one that understands the target language, frameworks, and common conventions, but has no special knowledge of this particular system's design intent.

## Relationship to Manifestation

Completeness is the precondition for predictable manifestation. In the ideal case, it yields full determinism:

```
Complete(G) ∧ Capable(A) → Deterministic(Manifest(G, A))
```

Perfect determinism — where every manifestation is identical — is an idealistic goal. In practice, the Spec Graph targets **predictability**: manifestations are equivalent across all dimensions the designer specified, even if they differ in incidental details. Determinism is the asymptote; predictability is the practical achievement.

Where `Capable(A)` means the agent can parse the graph, resolve dependencies, apply guidance, respect constraints, and verify outcomes. See [Manifestation](/docs/manifestation/overview) for how agents process a complete graph.

## Model-Theoretic Roots

The notion of completeness in the Spec Graph is inspired by two related concepts from mathematical logic. In model theory, a [complete theory](https://en.wikipedia.org/wiki/Complete_theory) is one that decides every sentence in its language — for any statement φ, the theory either proves φ or proves ¬φ. The consequence is that all models of a complete theory are *elementarily equivalent*: they satisfy exactly the same sentences. A stronger property, [categoricity](https://en.wikipedia.org/wiki/Categorical_theory), requires that a theory has essentially one model up to isomorphism — all realizations are structurally identical, not merely equivalent in what they satisfy.

The Spec Graph draws on both notions. Like a complete theory, a complete spec graph leaves no *relevant* question undecided — every decision the designer cares about is determined. Like a categorical theory, the goal is that all manifestations are the "same system" across specified dimensions, not merely that they agree on observable properties. The parameterized equivalence relation — where adding node types progressively tightens equivalence from behavioral to structural to total — mirrors the relationship between these concepts: completeness guarantees agreement on sentences, while categoricity guarantees structural identity.

We use the term "completeness" rather than "categoricity" for two reasons: it is far more intuitive for a non-mathematical audience, and the correspondence is deliberately loose. The Spec Graph departs from both model-theoretic notions in important ways — completeness is relative to the implementing agent rather than absolute, equivalence is parameterized by dimension rather than fixed, and an acceptable residual gap of benign decisions is by design rather than a failure of the theory. These are engineering adaptations, not formal instantiations of the mathematical concepts.
