---
sidebar_position: 3
title: From Behavior-Only Specs
---

# Migrating from Behavior-Only Specs

If you already maintain a behavior-only specification (for example, a `SPEC.json` file), this guide shows how to migrate to Spec Graph.

## What Changes

| Aspect | Behavior-Only Spec | Spec Graph |
|---|---|---|
| Node types | `behavior` only | core + extension node types |
| Structure | Flat array, often nested under features | Graph with typed edges |
| Storage | Single file | File-per-node directory |
| Relationships | Implicit via grouping | Explicit typed edges |
| Tech guidance | External docs or agent instructions | Decision nodes |
| Domain model | Implicit | Domain nodes |
| Constraints | Implicit or prose | Policy nodes + `constraints` fields |
| Edge storage | N/A | Node-local (`links`) |

## What Stays the Same

- **Atomicity**: one behavior node should still capture one observable outcome
- **Declarative**: specs still describe truth, not implementation steps
- **Verifiable**: each node still needs pass/fail verification criteria
- **Repo-first**: the graph still lives in version control as source of truth

## Migration Steps

### Step 1: Extract Behaviors

Convert each behavior into a standalone node file:

**Before (behavior-only `SPEC.json`):**

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
      "verification": "pytest tests/auth/test_login.py -k AUTH_01"
    }]
  }]
}
```

**After (`nodes/behaviors/AUTH-01.json`):**

```json
{
  "id": "AUTH-01",
  "type": "behavior",
  "title": "Login Form Display",
  "expectation": "Login page renders email and password fields",
  "constraints": ["Password field must mask input"],
  "verification": "pytest tests/auth/test_login.py -k AUTH_01"
}
```

Changes:

- `name` -> `title`
- Added `type: "behavior"`
- `invariant` (string) -> `constraints` (array of strings)
- Each behavior becomes its own file

### Step 2: Create Grouping Nodes

Convert feature-level groupings into explicit `feature` nodes:

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

Optional horizontal extraction after baseline migration:

- Keep product slices as `feature` nodes
- Move shared infrastructure groupings into `layer` nodes
- Add `feature -> depends_on -> layer` edges where needed

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

### Step 4: Extract Design Decisions

What previously lived in implementation notes or agent instructions should become decision nodes:

```text
"all auth goes through AuthProvider" -> DEC-AUTH-01
"use PostgreSQL for primary state" -> DEC-DATA-01
"use gRPC between services" -> DEC-API-01
```

### Step 5: Add Edges

Connect behaviors to the nodes that guide them:

```json
// In AUTH-01.json
"links": {
  "depends_on": ["DEC-AUTH-01"],
  "implements": ["DOM-USER-01"]
}
```

### Step 6: Add Domain and Policy Nodes

Use the [minimality test](/docs/theory/minimality): add domain/policy nodes where leaving them out would create manifestation ambiguity.

## Coexistence During Migration

During migration, your original behavior-only spec can coexist with the new graph directory. You can project behavior nodes back into a compatibility file when legacy tooling still needs that format.

This lets teams migrate incrementally without breaking existing workflows.

## Key Differences to Watch

### Edges Replace Structural Nesting

In behavior-only formats, belonging is often implied by nesting. In Spec Graph, membership is explicit through `contains` edges.

### Verification Is Richer

Behavior nodes keep a single verification string for simplicity. Contract nodes (foundation, decision, domain, policy, and extensions) support verification arrays with structured entries (`command`, `http`, `manual`, `observation`, `policy`).
