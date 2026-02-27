---
sidebar_position: 3
title: Context Assembly
---

# Context Assembly

When manifesting a single behavior, the agent assembles its full **context** from the graph. Context assembly is the mechanism that makes the spec graph more than a collection of independent nodes.

## How It Works

Starting from a behavior node, the agent follows all outbound edges to gather related nodes:

```
Behavior: AUTH-01 "Login Form Display"
  │
  ├─ depends_on: DEC-AUTH-01 "Abstract Auth Provider Interface"
  │     → "All auth goes through AuthProvider interface..."
  │     └─ depends_on: DEC-AUTH-02 "Clerk Authentication Provider"
  │           → "Use Clerk for OAuth and session management..."
  │
  ├─ implements: DOM-USER-01 "User Account"
  │     → "A registered entity that can authenticate..."
  │     → constraints: "Email unique, verified before access"
  │
  └─ (via inverse) POL-PERF-01 "Page Load Budget"
       → "FCP within 1.5s on 4G..."
```

The assembled context gives the agent **everything it needs** to implement this behavior correctly — without searching through external documents, agent instructions, or tech stack profiles.

## Context Depth

Context assembly follows edges to a configurable depth:

- **Depth 1**: Direct edges from the behavior node
- **Depth 2**: Edges from depth-1 nodes (e.g., the tech stack that an architectural decision depends on)
- **Full**: Transitive closure of all reachable nodes

In practice, depth 2 is usually sufficient. Going deeper can include nodes that are contextually relevant but not directly actionable for this behavior.

## Inverse Edges

Some context comes from **inverse edges** — nodes that point TO this behavior:

- A policy node with `"constrains": ["AUTH-01"]` is relevant context for AUTH-01, even though AUTH-01 doesn't link to it
- A grouping node (`feature` or `layer`) with `"contains": ["AUTH-01"]` provides namespace context
- A policy or decision that constrains an ancestor feature/layer/domain of AUTH-01 is inherited by AUTH-01 via `contains` propagation
- Layer-originated guidance can also be inherited when AUTH-01 (or its parent grouping node) transitively depends on a layer

Tooling computes inverse edges from the stored forward edges and includes them in context assembly.

## Decision Metadata in Context

For decision nodes, `metadata.rationale` is required and must be included in assembled context.  
`metadata.rejected_alternatives` is optional but should be included whenever present so agents can avoid previously rejected approaches.

## Context as a Document

The assembled context for a behavior can be rendered as a structured document:

```markdown
# Context for AUTH-01: Login Form Display

## Behavior
Login page renders email and password input fields with a submit button.
Constraints: Password field must mask input characters.

## Architectural Decisions
- DEC-AUTH-01: All auth operations go through an AuthProvider interface.
  Constraints: Interface must define authenticate(), validateSession(), revokeSession().

## Technology Decisions
- DEC-AUTH-02: Use Clerk as the production authentication provider.
  Constraints: Use Clerk's middleware for route protection.

## Domain Concepts
- DOM-USER-01: User Account — a registered entity that can authenticate,
  own resources, and have role-based permissions.

## Policies
- POL-PERF-01: All pages must reach FCP within 1.5s on 4G. (severity: hard)

## Verification
npm test -- --grep AUTH-01
```

This document is what the implementing agent "sees" when building AUTH-01. It includes direct edges, inverse edges, and effective propagated guidance.

## Why Context Assembly Matters

Without context assembly, the agent must independently discover that:

- Auth should go through an abstract interface (from a decision node)
- Clerk is the auth provider (from another decision node)
- "User" means a registered entity with specific properties (from a domain node)
- The page must load in under 1.5s (from a policy node)

If any of these are missed, the implementation may diverge from the designer's intent. Context assembly ensures completeness at the per-behavior level.
