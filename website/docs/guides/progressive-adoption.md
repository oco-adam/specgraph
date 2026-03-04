---
sidebar_position: 2
title: Progressive Adoption
---

# Progressive Adoption

The Spec Graph is designed for incremental adoption. You don't need every node type from day one — start with behaviors and add dimensions as the [minimality test](/docs/theory/minimality) demands.

Use this guide to decide **what** to add to the graph.  
For **how** to operate on the graph in day-to-day work, use the agent-driven [MCP Server workflow](/docs/guides/mcp-server).

## The Adoption Path

### Level 1: Behavior-Only

Start here. A behavior-only spec graph is valid and useful. It captures what the system does and provides testable acceptance criteria.

```
specgraph/
  graph.json
  nodes/
    features/AUTH.json
    layers/PLATFORM.json        # optional, when shared infra exists
    foundations/FND-01.json     # optional, for cold-start bootstrapping
    behaviors/AUTH-01.json
    behaviors/AUTH-02.json
```

**What you get:** behavioral equivalence. Two agents produce systems that do the same things.

**What you don't get:** architectural, technological, or visual consistency.

### Level 2: + Decision Nodes

When you discover that different implementations make incompatible architecture or technology choices, add decision nodes.

```
specgraph/
  graph.json
  nodes/
    features/AUTH.json
    behaviors/AUTH-01.json
    behaviors/AUTH-02.json
    decisions/DEC-AUTH-01.json    ← NEW
    decisions/DEC-AUTH-02.json    ← NEW
```

**Trigger:** "The last two manifestations used different auth libraries" or "Agent keeps putting auth logic in the wrong place."

**What you get:** structural and technological equivalence added to behavioral equivalence.

### Level 2.5: + Foundation Nodes

When the repository must be bootstrapped from scratch and agents need a concrete physical anchor before implementing decisions, add foundation nodes.

```
  nodes/
    ...
    foundations/FND-01.json       ← NEW
```

**Trigger:** "The agent hallucinated scaffolding in the wrong language/framework" or "No physical codebase existed for the agent to anchor its decisions to."

**What you get:** a concrete, verified physical baseline. The repository is bootstrapped with the right module system, directory layout, and package manifests.

### Level 3: + Layer Nodes

When multiple features share foundational infrastructure guidance, add a layer node.

```
  nodes/
    ...
    layers/PLATFORM.json        ← NEW
```

**Trigger:** "Multiple feature slices depend on the same platform/security/data decisions."

**What you get:** explicit horizontal architecture and reusable shared guidance.

### Level 4: + Domain Nodes

When business terms are ambiguous or domain rules are being violated, add domain nodes.

```
  nodes/
    ...
    domains/DOM-USER-01.json     ← NEW
```

**Trigger:** "The agent interpreted 'user' as a profile, but we mean an account" or "Status transitions are wrong."

**What you get:** domain equivalence — same data model and business rules.

### Level 5: + Policy Nodes

When non-functional requirements need measurement, add policy nodes.

```
  nodes/
    ...
    policies/POL-PERF-01.json  ← NEW
```

**Trigger:** "The page is too slow" or "We need WCAG compliance."

**What you get:** policy equivalence — same non-functional characteristics.

### Level 6: + Extension Types

When core types don't provide enough precision for a specific dimension:

```
  nodes/
    ...
    design_tokens/DT-COLOR-01.json   ← NEW
    api_contracts/API-AUTH-01.json    ← NEW
```

**Trigger:** "Visual inconsistency between features" or "API contract keeps changing."

## When to Move to the Next Level

Each level is triggered by a **manifestation failure** — a case where the current graph doesn't prevent an undesirable outcome:

| Failure | Add |
|---|---|
| Two implementations have incompatible architectures | Decision nodes (architecture) |
| Agent hallucinated scaffolding or wrong ecosystem | Foundation nodes |
| Wrong technology or library was used | Decision nodes (stack) |
| Multiple features require the same infrastructure context | Layer nodes |
| Agent misunderstood a business term | Domain nodes |
| Performance or security requirement was violated | Policy nodes |
| Visual design is inconsistent | Design token extensions |

## You Don't Need Every Level

Many projects will never reach Level 6. A behavior + decision graph (Level 2) may be sufficient for most internal tools. The key insight is:

> **Only add nodes that prevent actual manifestation problems.**

Speculative nodes — added "just in case" — violate minimality and add noise.

## Migrating from No Spec

If your project has no formal spec at all:

1. **Audit existing behavior** — what does the system currently do?
2. **Write behavior nodes** — one per observable action
3. **Group vertical slices** — create feature nodes
4. **Extract shared horizontal capabilities** — create layer nodes only when multiple features depend on them
5. **Bootstrap the physical baseline** — if the repo is greenfield, add foundation nodes declaring required scaffolding (module manifests, directory layout)
6. **Build the index** — create `graph.json`
7. **Validate** — run the schema validator
8. **Iterate** — add decision/layer/foundation/domain/policy nodes as needed

The initial behavior audit is the most time-consuming step. Once you have behaviors, the graph grows incrementally.
