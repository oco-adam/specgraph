---
sidebar_position: 1
title: Overview
---

# Manifestation

**Manifestation** is the process of going from specification to running system. It encompasses all intermediate steps: planning, designing, coding, building, testing, and deploying.

```
Spec Graph  →  [Manifest]  →  Running System
     G              A               M
```

Where:
- **G** = the spec graph
- **A** = the implementing agent (or team of agents)
- **M** = the manifested system

## The Manifestation Property

When a spec graph is [complete](/docs/theory/completeness) and the implementing agent is capable:

```
Complete(G) ∧ Capable(A) → Deterministic(Manifest(G, A))
```

This means: the same graph, processed by the same (or equivalent) agent, always produces logically equivalent systems.

## What "Capable" Means

A capable implementing agent can:

1. **Parse** the spec graph — load `graph.json`, resolve all node references
2. **Traverse** the graph — follow edges, resolve dependencies
3. **Apply guidance** — implement according to decision nodes
4. **Respect constraints** — verify non-functional requirements
5. **Verify outcomes** — run each node's verification criteria

## Conceptual Phases

The manifestation process has three conceptual phases:

| Phase | Input | Output | Activity |
|---|---|---|---|
| **Orient** | All nodes | System understanding | Read and comprehend the full graph |
| **Scaffold** | Decision + domain nodes | Infrastructure | Create architecture, abstractions, shared code |
| **Implement** | Behavior nodes + context | Working features | Build each behavior with full graph context |

These phases are described in detail in [Orient, Scaffold, Implement](/docs/manifestation/orient-scaffold-implement).

## Not a Rigid Pipeline

The three phases are conceptual, not prescriptive steps. A capable agent might:

- Process phases iteratively rather than sequentially
- Interleave scaffold and implement work
- Revisit earlier phases when new information emerges

What matters is the **outcome**: the manifested system satisfies all nodes in the graph. The phases describe the natural ordering of information, not a mandatory workflow.

## Manifestation vs. Task Derivation

The spec graph is a specification, not a task list. The mapping from graph to tasks is determined by the agent's planning phase:

- Each approved behavior node typically yields one implementation task
- Decision nodes may yield infrastructure/setup tasks
- Constraint nodes yield verification tasks
- Domain nodes inform all tasks but may not generate their own

The specific task derivation strategy is an agent concern, not a spec graph concern. Different agents may derive different task orderings while producing equivalent results.
