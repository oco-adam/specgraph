---
sidebar_position: 1
title: Writing Nodes
---

# Writing Nodes

This guide covers the practical mechanics of writing good spec graph nodes.

## The Universal Structure

All normative nodes (everything except features) follow a pattern:

1. **Declare** what must be true (`statement` or `expectation`)
2. **Constrain** what limits apply (`constraints` or `invariant`)
3. **Verify** how to check it (`verification`)

This maps to the question: "What is true? What must hold? How do we know?"

## Writing Good Statements

The `statement` field (or `expectation` for behaviors) is the core of every node. It should be:

### Specific

```
✅ "Use Clerk as the production authentication provider for OAuth and session management."
❌ "Use a managed authentication service."
```

### Actionable

An implementing agent should be able to determine exactly what to do.

```
✅ "All auth operations go through an AuthProvider interface with authenticate(), validateSession(), revokeSession()."
❌ "Auth should be abstracted properly."
```

### Declarative

State what must be true, not the steps to get there.

```
✅ "Task status transitions follow: backlog → in-progress → review → done."
❌ "First create a status enum, then add a transition validator..."
```

## Writing Good Constraints

Constraints are normative invariants — conditions that must always hold.

### Each Constraint is Independent

```json
"constraints": [
  "Interface must define authenticate()",
  "Interface must define validateSession()",
  "No auth call may bypass the interface"
]
```

Not:
```json
"constraints": [
  "Interface must define authenticate() and validateSession() and no call may bypass it"
]
```

### Constraints Are Testable

Each constraint should map to a verifiable condition:

```json
"constraints": ["Email uniqueness is enforced at the database level"]
// → Verifiable by checking the schema has a unique constraint on email
```

## Writing Good Verification

Verification criteria produce **pass/fail** results. Prefer executable checks:

### Executable (Best)

```json
"verification": ["npm test -- --grep AUTH-01"]
```

```json
"verification": [
  { "kind": "command", "command": "npx tsc --noEmit" },
  { "kind": "command", "command": "npm test -- --grep DEC-AUTH-01" }
]
```

### Observable (Acceptable)

```json
"verification": [
  {
    "kind": "observation",
    "description": "Visual inspection: task cards match spec in all four columns"
  }
]
```

### Manual (Last Resort)

```json
"verification": [
  {
    "kind": "manual",
    "steps": [
      "Open the login page in Chrome",
      "Submit invalid email format",
      "Verify error appears below email field"
    ],
    "expected": "Inline error message visible without page reload"
  }
]
```

## Using Metadata

The `metadata` field is for **non-normative context** — information that helps humans understand the node but is never a requirement:

```json
"metadata": {
  "rationale": "Enables deterministic testing of auth flows.",
  "notes": "Consider adding a MockProvider for unit tests.",
  "owner": "auth-team",
  "tags": ["auth", "architecture"]
}
```

**Key rule:** if something in metadata would change implementation if removed, it belongs in `statement` or `constraints`, not metadata.

## Status Lifecycle

All nodes go through a status lifecycle:

```
draft → proposed → approved → deprecated → rejected
```

| Status | Meaning |
|---|---|
| `draft` | Work in progress, not yet ready for review |
| `proposed` | Ready for review, not yet binding |
| `approved` | Binding — must be implemented and verified |
| `deprecated` | Was approved, now being phased out |
| `rejected` | Reviewed and explicitly not adopted |

Only `approved` nodes are binding during manifestation. Tooling should skip `draft`, `proposed`, `deprecated`, and `rejected` nodes when assembling context for implementation.
