---
sidebar_position: 1
title: Writing Nodes
---

# Writing Nodes

This guide covers the practical mechanics of writing good spec graph nodes.

## The Universal Structure

All normative nodes (everything except features) follow a pattern:

1. **Declare** what must be true (`statement` or `expectation`)
2. **Constrain** what limits apply (`constraints`)
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

Each `constraints` entry is an independent, normative condition that must hold.
The condition's own language carries its temporal semantics — "must hold at all
times" vs "must eventually hold" vs "must hold within N seconds."

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

## Conditions, Enforcement, and Strictness

The framework separates three orthogonal concerns:

### 1. Condition — what must hold (`constraints` on any node)

The condition text states what is required. It should be specific enough that an
implementor knows exactly what to check. The condition's own language carries its
temporal semantics:

```
"Email must be unique"                        — strong consistency implied
"Email must be eventually unique"             — eventual consistency acceptable
"Email must be unique within 5s of creation"  — bounded eventual consistency
```

All of these are normative — they are not suggestions. An implementor must respect
the condition, including its temporal qualifier.

### 2. Enforcement — how it's guaranteed (decision node)

If the enforcement model is a dangerous completeness gap — meaning two implementors
could choose incompatible approaches — capture it as a decision node:

```json
{
  "type": "decision",
  "id": "DEC-DATA-01",
  "category": "architecture",
  "title": "Eventual Consistency for User Records",
  "statement": "User records use eventual consistency with a convergence window under 5 seconds",
  "constraints": [
    "A background uniqueness checker runs every 2 seconds",
    "Duplicate accounts detected after convergence are merged, not deleted"
  ],
  "verification": [
    "Integration test: two concurrent registrations with same email both succeed initially, one is merged within 5s"
  ],
  "links": {
    "constrains": ["REG-01"]
  }
}
```

Apply the minimality test: if removing the enforcement choice would let an agent
pick the wrong consistency model, add a decision node.

### 3. Strictness — whether violation blocks manifestation (policy node severity)

For cross-cutting non-functional requirements, policy nodes have `severity`:

- `hard` — violation blocks manifestation
- `soft` — quality target, produces a warning

```json
{
  "type": "policy",
  "id": "POL-DATA-01",
  "severity": "hard",
  "title": "Convergence Window Budget",
  "statement": "All eventually-consistent operations must converge within 5 seconds under normal load",
  "constraints": ["Measured at p99 under 100 concurrent writes per second"],
  "verification": [
    { "kind": "command", "command": "npm run test:convergence -- --timeout 5000" }
  ],
  "links": { "constrains": ["REG-01"] }
}
```

Severity applies to the policy node as a whole, not to individual `constraints`
field entries. Field-level `constraints` entries are always normative.

:::info Disambiguation: `constraints` field vs policy nodes vs `constrains` edges

The spec graph uses related but distinct concepts:

| Concept | What it is | Scope |
|---------|-----------|-------|
| `constraints` field | Array of normative conditions on a single node | Narrows THIS node's `expectation` or `statement` |
| Policy node (`type: "policy"`) | A standalone node for cross-cutting NFRs | Affects OTHER nodes via `constrains` edges; has `severity` (hard/soft) |
| `constrains` edge | A graph relationship | Declares that the source node narrows implementation choices for the target |

**Decision rule:**
- Condition specific to one node → `constraints` field entry on that node
- Cross-cutting requirement affecting multiple nodes → policy node with `constrains` edges
- Expressing that one node limits another → `constrains` edge

:::

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

## Status Is Workflow-Derived

**Status is not stored in nodes.** A node's lifecycle state is determined by git context:

- **Draft** — the node exists on a feature branch that hasn't been reviewed yet
- **Proposed** — the node's branch has an open pull request
- **Approved** — the PR merged to the main branch
- **Deprecated** — a `supersedes` edge from another node points to it
- **Rejected** — the PR was closed without merging

This keeps nodes purely declarative and avoids the **mutation-after-approval paradox** — where marking a node as "approved" requires editing a file that was already reviewed, creating a tautological commit. By deriving status from git workflow, the spec graph describes *what the system is*, not *where each node is in a review process*.
