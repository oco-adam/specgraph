---
sidebar_position: 2
title: Atomicity Rules
---

# Atomicity Rules

Every node in the Spec Graph must be **atomic** — expressing exactly one decision, one behavior, one concept, or one constraint.

## The General Rule

> **Each node MUST express ONE decision / ONE contract / ONE constraint, with ONE verification intent.**

If it contains "and" across multiple decisions, split it.

## Type-Specific Atomicity

### Behavior Nodes

The **ONE Rule** from DLOOP v1:

> ONE trigger → ONE behavior → ONE outcome

```
✅ "Login page renders email and password input fields with a submit button"
   (One observable state)

❌ "Login page renders a form and validates input and redirects on success"
   (Three behaviors — split into form display, validation, redirect)
```

### Decision Nodes

**ONE decision per node:**

```
✅ "Use Clerk for authentication" (one technology choice)
✅ "All auth goes through an AuthProvider interface" (one pattern)

❌ "Use Clerk for auth, Next.js for frontend, and Convex for backend"
   (Three decisions — split into three nodes)
```

### Domain Nodes

**ONE concept per node:**

```
✅ "User Account: A registered entity that can authenticate and own resources"
✅ "Task: A unit of work that moves through a Kanban workflow"

❌ "Users and Projects: Users belong to projects and have roles"
   (Two concepts — split into User and Project nodes)
```

### Constraint Nodes

**ONE measurable requirement per node:**

```
✅ "All pages must reach FCP within 1.5s on 4G"
✅ "All user data must be encrypted at rest with AES-256"

❌ "Pages must load fast and data must be encrypted"
   (Two requirements — split into performance and security nodes)
```

## Size Guidelines

Atomicity is enforced partly through size limits. These are guidelines, not hard limits:

| Field | Target Maximum |
|---|---|
| `statement` / `expectation` | 240 characters |
| Each `constraint` entry | 140 characters |
| Each `verification` entry (string) | 180 characters |
| `metadata.rationale` | No limit (but keep concise) |

If you're hitting these limits, the node is probably trying to say too much. Split it.

## The Split Test

When in doubt about whether to split:

1. **Can you write one verification for it?** If you need two unrelated checks, split.
2. **Could you change one half without changing the other?** If yes, they're independent — split.
3. **Does the title need "and"?** If the title is "X and Y," it's probably two nodes.

## Why Atomicity Matters

### Reviewability

Small nodes are easy to review. A reviewer can assess a single decision in seconds. A compound node requires understanding multiple decisions and their interactions.

### Composability

Atomic nodes combine without hidden coupling. If "Use Clerk" and "Abstract auth provider" are separate nodes, you can change the Clerk decision without touching the abstraction pattern.

### Traceability

When a verification fails, an atomic node points to exactly one thing that's wrong. A compound node requires investigation to determine which part failed.

### Edge Precision

Edges between atomic nodes are precise. "`AUTH-01` depends on `DEC-AUTH-01`" is clear. "`AUTH-01` depends on `DEC-EVERYTHING-01`" (which contains five decisions) is ambiguous about which decision matters.
