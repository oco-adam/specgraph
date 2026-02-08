---
sidebar_position: 2
title: Node Types Overview
---

# Node Types Overview

The Spec Graph uses a **tiered type system**: five core types that every graph can use, plus extension types for richer modelling.

## Core Types

These five types are sufficient for most spec graphs:

| Type | Purpose | Key Question |
|---|---|---|
| **`feature`** | Grouping and namespace | How are specs organized? |
| **`behavior`** | Observable system behavior | What does the user see and do? |
| **`decision`** | Architectural, technical, or stack decision | How should it be built, and with what? |
| **`domain`** | Business concept, term, or rule | What do the domain terms mean? |
| **`constraint`** | Non-functional requirement | What limits must be met? |

### Node Shapes

The core types use two distinct shapes:

**Behavior nodes** carry `expectation` and `invariant` as their primary fields — these are the canonical fields for describing observable behavior:

```json
{
  "id": "AUTH-01",
  "type": "behavior",
  "title": "Login Form Display",
  "expectation": "Login page renders email and password input fields with a submit button",
  "invariant": "Password field must mask input characters",
  "verification": "npm test -- --grep AUTH-01",
  "status": "approved"
}
```

**All other non-feature types** (decision, domain, constraint, and extensions) share a uniform **contract shape**:

```json
{
  "id": "DEC-AUTH-01",
  "type": "decision",
  "category": "architecture",
  "title": "Abstract Auth Provider Interface",
  "statement": "All auth operations go through an AuthProvider interface.",
  "constraints": ["Interface must define authenticate(), validateSession(), revokeSession()"],
  "verification": ["npx tsc --noEmit", "npm test -- --grep DEC-AUTH-01"],
  "status": "approved"
}
```

**Feature nodes** are the simplest — they have `title`, `description`, and `status`, plus `links` to group their children.

## Extension Types

For graphs that need finer-grained modelling, extension types are available:

| Extension Type | Purpose |
|---|---|
| `design_token` | Visual tokens: colors, typography, spacing |
| `ui_contract` | UI component props, states, variants |
| `api_contract` | REST, GraphQL, or event contracts |
| `data_model` | Database schemas, migrations, invariants |
| `artifact` | Content-addressed external artifact |
| `equivalence_contract` | Formal definition of "same system" |
| `pipeline` | Manifestation pipeline steps and gates |

Extension types use the same contract shape as decision/domain/constraint nodes. They add no new fields — the `type` value is what distinguishes them.

## The Decision Type

The `decision` type deserves special attention because it **merges** what earlier research called "technical" and "stack" into a single type with a `category` field:

| Category | What It Captures | Example |
|---|---|---|
| `architecture` | Structural patterns, module boundaries | "All auth goes through an AuthProvider interface" |
| `stack` | Technology choices and usage constraints | "Use Clerk for authentication" |
| `pattern` | Implementation patterns | "Use optimistic updates for drag-and-drop" |
| `interface` | Public API contracts between modules | "Auth module exports authenticate() and revokeSession()" |

This merging reflects the reality that architectural decisions and technology choices exist on a continuum — the distinction was blurry in practice.

## Type Summary

```
┌──────────────┬─────────────────────┬──────────────────────────────────┐
│ Type         │ Key Field           │ Answers                          │
├──────────────┼─────────────────────┼──────────────────────────────────┤
│ feature      │ description         │ How are specs grouped?           │
│ behavior     │ expectation         │ What does the user see/do?       │
│ decision     │ statement + category│ How should it be built?          │
│ domain       │ statement           │ What do domain concepts mean?    │
│ constraint   │ statement + severity│ What limits must be met?         │
└──────────────┴─────────────────────┴──────────────────────────────────┘
```

For detailed documentation on each type, see the [Node Types](/docs/node-types/behavior) section.
