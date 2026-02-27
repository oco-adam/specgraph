---
sidebar_position: 2
title: Node Types Overview
---

# Node Types Overview

Spec Graph uses a **tiered type system**: six core types plus optional extension types.

Core taxonomy in v2:

- 2 grouping types: `feature`, `layer`
- 4 normative core types: `behavior`, `decision`, `domain`, `policy`

## Core Types

| Type | Purpose | Key Question |
|---|---|---|
| **`feature`** | Vertical grouping and namespace | Which product slice does this spec belong to? |
| **`layer`** | Horizontal shared grouping | Which shared platform capability does this belong to? |
| **`behavior`** | Observable system behavior | What does the user see and do? |
| **`decision`** | Architectural, technical, or stack decision | How should it be built, and with what? |
| **`domain`** | Business concept, term, or rule | What do domain terms mean? |
| **`policy`** | Non-functional requirement | What limits must be met? |

### Node Shapes

**Grouping nodes** (`feature`, `layer`) use a simple shape with `title`, `description`, and optional `links`.

**Behavior nodes** carry `expectation` and optional `constraints`.

**Contract nodes** (decision, domain, policy, extensions) share a uniform shape with `statement` + `verification`.

## Extension Types

For finer-grained modeling, extension types are available:

| Extension Type | Purpose |
|---|---|
| `design_token` | Visual tokens: colors, typography, spacing |
| `ui_contract` | UI component props, states, variants |
| `api_contract` | REST, GraphQL, or event contracts |
| `data_model` | Database schemas, migrations, invariants |
| `artifact` | Content-addressed external artifact |
| `equivalence_contract` | Formal definition of "same system" |
| `pipeline` | Manifestation pipeline steps and gates |

## Decision Categories

Decision nodes use `category` to capture where the decision sits:

| Category | What It Captures | Example |
|---|---|---|
| `architecture` | Structural patterns, module boundaries | "All auth goes through an AuthProvider interface" |
| `stack` | Technology choices and usage constraints | "Use Clerk for authentication" |
| `pattern` | Implementation patterns | "Use optimistic updates for drag-and-drop" |
| `interface` | Public API contracts between modules | "Auth module exports authenticate() and revokeSession()" |

For detailed documentation on each type, see the [Node Types](/docs/node-types/behavior) section.
