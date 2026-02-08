---
sidebar_position: 2
title: Decision Nodes
---

# Decision Nodes

Decision nodes capture **any architectural, technical, or stack decision that narrows the solution space**. They represent the "how" and "with what" that a senior engineer would communicate to a team.

## Schema

```json
{
  "id": "DEC-AUTH-01",
  "type": "decision",
  "category": "architecture",
  "title": "Abstract Auth Provider Interface",
  "statement": "All authentication operations must go through an abstract AuthProvider interface. Concrete implementations include a production provider and a DeterministicProvider for testing.",
  "constraints": [
    "Interface must define: authenticate(), validateSession(), revokeSession()",
    "No authentication call may bypass the AuthProvider interface"
  ],
  "verification": [
    "npx tsc --noEmit",
    "npm test -- --grep DEC-AUTH-01"
  ],
  "status": "approved",
  "links": {
    "constrains": ["AUTH-01", "AUTH-04", "AUTH-05"]
  },
  "metadata": {
    "rationale": "Enables deterministic testing of auth flows without hitting external services."
  }
}
```

## Fields

| Field | Required | Description |
|---|---|---|
| `id` | Yes | Unique identifier (e.g., `DEC-AUTH-01`) |
| `type` | Yes | Must be `"decision"` |
| `category` | No | One of: `architecture`, `stack`, `pattern`, `interface` |
| `title` | Yes | Short name (3–140 chars) |
| `statement` | Yes | The declarative truth that must hold |
| `constraints` | No | Array of normative invariants |
| `verification` | Yes | Array of pass/fail checks (min 1) |
| `status` | Yes | Lifecycle status |
| `links` | No | Outbound edges |
| `metadata` | No | Non-normative context |

## Categories

The `category` field distinguishes sub-types of decisions:

### `architecture`

Structural patterns, module boundaries, abstraction layers.

```json
{
  "category": "architecture",
  "statement": "All auth operations go through an AuthProvider interface."
}
```

**When to use:** The decision affects the system's structure or module boundaries.

### `stack`

Technology choices, frameworks, libraries, and their usage constraints.

```json
{
  "category": "stack",
  "statement": "Use Clerk as the production authentication provider.",
  "constraints": ["Use Clerk's middleware for route protection"]
}
```

**When to use:** The decision is about which technology to use and how.

### `pattern`

Implementation patterns that guide how behaviors are built.

```json
{
  "category": "pattern",
  "statement": "Task status changes use optimistic updates with revert on failure."
}
```

**When to use:** The decision prescribes a specific coding pattern.

### `interface`

Public API contracts between modules or services.

```json
{
  "category": "interface",
  "statement": "The auth module exports authenticate() and revokeSession() functions."
}
```

**When to use:** The decision defines a boundary contract.

## Why One Type with Categories?

Earlier research separated "technical" and "stack" into distinct node types. In practice, the boundary was blurry — "Use Next.js App Router" is both a technology choice and an architectural decision. The single `decision` type with a `category` field reflects this reality.

## The Statement Field

The `statement` is the **declarative truth** that must hold. It should be:

- **Specific**: "Use Clerk for authentication" not "Use a managed auth provider"
- **Actionable**: an implementing agent can determine exactly what to do
- **Verifiable**: there's a way to check whether it's been followed

## When to Create Decision Nodes

Apply the [minimality test](/docs/theory/minimality):

> "If I removed this, could a competent implementing agent make a choice I wouldn't want?"

Common triggers:

| Scenario | Decision Category |
|---|---|
| Two implementations could use incompatible architectures | `architecture` |
| Technology choice affects how behaviors are implemented | `stack` |
| A specific coding pattern is required for quality/testability | `pattern` |
| Modules need a stable interface contract | `interface` |

## ID Conventions

Decision IDs follow the pattern `DEC-FEATURE-##`:

- `DEC-AUTH-01` — first decision in the AUTH feature
- `DEC-TB-03` — third decision in the TASKBOARD feature
- `DEC-PLATFORM-01` — platform-wide decision
