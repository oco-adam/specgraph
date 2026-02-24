---
sidebar_position: 3
title: Design Principles
---

# Design Principles

The Spec Graph framework is guided by six principles. These are not aspirational — they are load-bearing constraints that shape every design decision in the framework.

## 1. Atomicity Everywhere

DLOOP v1's ONE rule — ONE trigger, ONE behavior, ONE outcome — was a good idea. The Spec Graph generalises it:

> **Every node expresses one decision, one contract, or one constraint.**

If a node contains "and" across multiple decisions, split it. This applies to all node types, not just behaviors. A decision node captures one architectural decision. A domain node defines one business concept. A policy node specifies one measurable requirement.

Atomicity creates **review pressure** (each node is small enough to reason about), **composability** (nodes combine without hidden coupling), and **testability** (each node has a clear verification criterion).

## 2. Every Normative Node Must Be Verifiable

If it cannot be verified, it is not a complete spec.

Every node that makes a normative claim — a behavior, a policy, a decision — must include verification criteria that produce a pass/fail result. Verification can be:

- **Executable**: test commands, linters, policy checks
- **Static**: type checking, AST rules, dependency constraints
- **Observable**: manual inspection with unambiguous criteria

Unverifiable nodes are informational at best, misleading at worst.

## 3. The Graph Should Be Minimal

> **Only include what reduces manifestation ambiguity.**

Redundant or derived information belongs in generated artifacts, not the graph. The **minimality test** for any proposed node: "If I removed this, could a competent implementing agent make a choice I wouldn't want?" If yes, keep it. If no, remove it.

This is analogous to a basis in linear algebra — the minimal set of vectors that spans the space. The Spec Graph is the minimal set of specifications that spans the designer's intent space.

## 4. Progressive Adoption

A behavior-only graph is valid. You don't need to start with all node types.

Additional node types are added when the minimality test demands it — when manifestation ambiguity on a dimension the designer cares about requires explicit specification. A typical project grows its spec graph over time:

1. Start with behavior nodes (captures what the system does)
2. Add decision nodes (locks in architecture and tech stack)
3. Add domain nodes (establishes shared vocabulary)
4. Add policy nodes (sets non-functional boundaries)

## 5. Declarative Truth, Not Narrative Docs

Every decision that matters becomes a verifiable node in the graph, not prose in a document. The graph is the **constitution** — the single source of truth that agents and humans reference.

Narrative documentation is valuable for explanation, but it is not authoritative. If the docs disagree with the graph, the graph wins.

## 6. Normative vs. Informative Content

The framework strictly distinguishes:

- **Normative**: `expectation`, `statement`, `constraints`, `verification` — MUST be true, MUST be implemented, MUST pass
- **Informative/Contextual**: `metadata.rationale`, `metadata.notes` — non-executable context; specific node types may require certain metadata fields

This prevents "helpful notes" from becoming implicit requirements that break predictable manifestation.
