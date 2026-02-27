---
sidebar_position: 3
title: From DLOOP v1
---

# Migrating from DLOOP v1

If you have an existing DLOOP v1 project with a `SPEC.json`, this guide explains how to migrate to the Spec Graph format.

## What Changes

| Aspect | DLOOP v1 | Spec Graph |
|---|---|---|
| Node types | `behavior` only | 6 core + extensions |
| Structure | Flat array nested under features | Graph with typed edges |
| Storage | Single `SPEC.json` file | File-per-node directory |
| Relationships | Implicit (via feature grouping) | Explicit (typed edges) |
| Tech guidance | External (agent instructions, profiles) | Inline (decision nodes) |
| Domain model | Implicit (in code) | Explicit (domain nodes) |
| Constraints | External (agent instructions) | Inline (policy nodes) |
| Edge storage | N/A (no edges) | Node-local (`links` field) |

## What Stays the Same

- **Atomicity**: the ONE rule for behaviors carries forward unchanged
- **Declarative**: specs describe WHAT, not HOW (behaviors) or declare truths (decisions)
- **Verifiable**: every node has verification criteria
- **Repo-first**: the spec graph lives in git as the source of truth

## Migration Steps

### Step 1: Extract Behaviors

Convert each v1 behavior into a standalone node file:

**Before (SPEC.json v1):**
```json
{
  "features": [{
    "id": "AUTH",
    "name": "Authentication",
    "behaviors": [{
      "id": "AUTH-01",
      "name": "Login Form Display",
      "expectation": "Login page renders email and password fields",
      "invariant": "Password field must mask input",
      "verification": "npm test -- --grep AUTH-01"
    }]
  }]
}
```

**After (nodes/behaviors/AUTH-01.json):**
```json
{
  "id": "AUTH-01",
  "type": "behavior",
  "title": "Login Form Display",
  "expectation": "Login page renders email and password fields",
  "constraints": ["Password field must mask input"],
  "verification": "npm test -- --grep AUTH-01"
}
```

Changes:
- `name` → `title`
- Added `type: "behavior"`
- `invariant` (string) → `constraints` (array of strings)
- Each behavior is now its own file

### Step 2: Create Feature Nodes

Convert each v1 feature into a feature node:

```json
{
  "id": "AUTH",
  "type": "feature",
  "title": "User Authentication",
  "description": "Login, session management, and logout flows",
  "links": {
    "contains": ["AUTH-01", "AUTH-02", "AUTH-03"]
  }
}
```

### Step 3: Create the Graph Index

```json
{
  "specgraphVersion": "1.0.0",
  "nodes": [
    { "id": "AUTH", "path": "nodes/features/AUTH.json" },
    { "id": "AUTH-01", "path": "nodes/behaviors/AUTH-01.json" },
    { "id": "AUTH-02", "path": "nodes/behaviors/AUTH-02.json" }
  ]
}
```

### Step 4: Extract Tech Stack (Optional)

What's currently in tech stack profiles, agent instructions, or CLAUDE.md becomes decision nodes:

```
techStackProfile["nextjs-convex-v1"]  →  DEC-PLATFORM-01 (stack: Next.js)
                                      →  DEC-PLATFORM-02 (stack: Convex)
agent instructions "use AuthProvider"  →  DEC-AUTH-01 (architecture)
```

### Step 5: Add Edges

Connect behaviors to the decision nodes that guide them:

```json
// In AUTH-01.json
"links": {
  "depends_on": ["DEC-AUTH-01"],
  "implements": ["DOM-USER-01"]
}
```

### Step 6: Add Domain and Policy Nodes

Based on the minimality test — add them when actual manifestation ambiguity requires it.

## Coexistence

During migration, the original `SPEC.json` can coexist with the new spec graph directory. You can generate a v1-compatible `SPEC.json` from behavior nodes as a **projection** — a derived artifact.

This allows teams to migrate incrementally without breaking existing tooling that consumes `SPEC.json`.

## Key Differences to Watch

### Edges Replace Feature Nesting

In v1, behaviors belong to features by nesting. In the Spec Graph, belonging is expressed via the `contains` edge in the feature node. A node could conceptually belong to multiple features.

### Verification Is Richer

V1 behavior verification was a single string. Spec Graph contract nodes (decision, domain, policy) support arrays of verification entries, including structured formats (command, http, manual).

Behavior nodes keep the single-string verification for simplicity.
