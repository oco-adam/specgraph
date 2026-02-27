---
sidebar_position: 3
title: When to Add Nodes
---

# When to Add Nodes

Not every system needs all node types. The Spec Graph grows organically in response to manifestation ambiguity — you add nodes when the [minimality test](/docs/theory/minimality) demands it.

## The Minimality Test

For any proposed node:

> "If I removed this, could a competent implementing agent make a choice I wouldn't want?"

- **If yes** → the node is load-bearing, add it
- **If no** → the node is redundant, don't add it

## Triggers by Node Type

### Add Behavior Nodes When...

- There's an observable user-facing action to specify
- A feature needs testable acceptance criteria
- The system must respond to a specific trigger

**Always start here.** Behaviors are the foundation of every spec graph.

### Add Decision Nodes When...

| Scenario | Category |
|---|---|
| Two implementations could use incompatible architectures | `architecture` |
| A technology choice affects how behaviors are implemented | `stack` |
| A specific coding pattern is required for testability or quality | `pattern` |
| Modules need a stable interface contract | `interface` |

**Key signal:** you find yourself writing the same guidance in multiple PR reviews, agent instructions, or CLAUDE.md files. If you're repeating it, it should be a node.

### Add Layer Nodes When...

- Two or more features depend on the same infrastructure capability
- Shared architectural guidance is being duplicated across feature namespaces
- Cross-feature platform concerns (security baseline, data access layer, observability) need explicit grouping

**Key signal:** the same infrastructure decisions/policies are repeated across multiple vertical slices. Promote them into a `layer` and have features depend on it.

### Add Domain Nodes When...

- A business term is ambiguous without explicit definition
- Multiple behaviors reference the same concept differently
- Domain rules constrain valid implementations
- The implementing agent might confuse two similar concepts

**Key signal:** you say "by 'user' I mean..." more than once.

### Add Policy Nodes When...

- Performance, security, or accessibility must be measured
- A non-functional requirement cuts across multiple features
- Cost budgets must be enforced
- Reliability targets need explicit verification

**Key signal:** the quality attribute matters enough that you'd reject an implementation that ignores it. Express it as a policy node with appropriate severity.

### Add Extension Types When...

Core types don't provide enough precision:

| Extension | Trigger |
|---|---|
| `design_token` | Visual inconsistency between features is unacceptable |
| `api_contract` | Service boundaries need formal specification |
| `data_model` | Database schema decisions are load-bearing |
| `equivalence_contract` | You need reproducible re-manifestation |
| `pipeline` | Build/deploy process must be explicitly specified |

## The Growth Pattern

A typical project's spec graph grows in this order:

```
1. Early stage:     behavior nodes only
2. Tech decisions:  + decision nodes (stack category)
3. Architecture:    + decision nodes (architecture/pattern categories)
4. Domain model:    + domain nodes
5. Quality gates:   + policy nodes
6. Refinement:      + extension types as needed
```

## Don't Pre-Populate

A common mistake is trying to fill in every node type from the start. This leads to non-minimal graphs with speculative nodes that don't reduce actual ambiguity.

Instead:

1. Start with behaviors
2. Try to manifest (or mentally simulate manifestation)
3. When the agent would make a wrong choice → add the node that prevents it
4. Repeat

This keeps the graph minimal and every node justified.

## Removing Nodes

Nodes should also be removed when they stop being load-bearing. Common reasons:

- The decision became so standard it's a framework convention (no ambiguity)
- The constraint was temporary (e.g., a cost limit during a promotional period)
- A domain concept was consolidated with another
- A node was superseded by a new node

Add a `supersedes` edge from the replacement node if applicable. The old node's deprecated state is inferred from the existence of this edge.
