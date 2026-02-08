---
sidebar_position: 6
title: Extension Types
---

# Extension Types

Extension types provide finer-grained modelling for graphs that need it. They use the same **contract shape** as decision, domain, and constraint nodes — the `type` value is what distinguishes them.

## Available Extensions

| Type | Purpose | When to Use |
|---|---|---|
| `design_token` | Visual tokens: colors, typography, spacing, shadows | When visual consistency matters and design decisions are load-bearing |
| `ui_contract` | UI component contracts: props, states, variants | When component interfaces need to be specified |
| `api_contract` | REST, GraphQL, or event contracts | When API boundaries need formal specification |
| `data_model` | Database schemas, migrations, invariants | When data structure decisions are load-bearing |
| `artifact` | Content-addressed external artifact | When external assets (Figma tokens, config files) must be pinned |
| `equivalence_contract` | Formal definition of "same system" | When you need an explicit equivalence definition |
| `pipeline` | Manifestation pipeline steps and gates | When the build/deploy process must be specified |

## Schema

All extension types use the same contract shape:

```json
{
  "id": "DT-TASKCARD-01",
  "type": "design_token",
  "title": "Task Card Design Token",
  "statement": "Visual specification for task cards on the board.",
  "constraints": [
    "Card: white background, 1px border-muted, 8px radius, 12px padding",
    "Title: 14px semibold",
    "Priority badge: top-right, colored dot (critical=red, high=orange, medium=blue, low=gray)"
  ],
  "verification": [
    {
      "kind": "observation",
      "description": "Visual inspection: task cards match spec in all four columns"
    }
  ],
  "status": "approved",
  "links": {
    "constrains": ["TASKBOARD-02"]
  }
}
```

## Design Tokens

Design tokens capture the visual language of the system — colors, typography, spacing, shadows, radii.

```json
{
  "type": "design_token",
  "title": "Primary Color Palette",
  "statement": "Primary interactive color is oklch(59.59% 0.24 275.75).",
  "constraints": [
    "All interactive elements use the primary palette",
    "Primary-hover is oklch(52.85% 0.24 275.75)"
  ],
  "verification": ["CSS audit: no hardcoded colors outside the token system"]
}
```

**Use when:** visual consistency matters and the design system is a load-bearing part of the spec.

## API Contracts

API contracts specify the interface between services or modules.

```json
{
  "type": "api_contract",
  "title": "Auth API Contract",
  "statement": "POST /api/auth/login accepts {email, password} and returns {token, user}.",
  "constraints": [
    "Returns 401 on invalid credentials",
    "Returns 429 after 5 failed attempts in 15 minutes"
  ],
  "verification": [
    {
      "kind": "http",
      "method": "POST",
      "url": "http://localhost:3000/api/auth/login",
      "expectStatus": 200
    }
  ]
}
```

## Artifacts

Artifact nodes pin external inputs (Figma exports, config files, etc.) by **content hash** so that manifestation can be reproduced later.

```json
{
  "id": "ART-DS-01",
  "type": "artifact",
  "title": "Design Tokens Export (Pinned)",
  "statement": "Pinned design token export used as an input to derived nodes.",
  "artifact": {
    "sha256": "0000000000000000000000000000000000000000000000000000000000000000",
    "source": "figma://file/abc123?node-id=...",
    "format": "tokens-studio-json"
  },
  "verification": ["specgraph verify-artifacts --id ART-DS-01"],
  "status": "approved"
}
```

## Pins for `derived_from`

When a node is derived from an artifact, use `links.derived_from` plus `pins` so tooling can detect staleness:

```json
{
  "id": "DT-TASKCARD-01",
  "type": "design_token",
  "title": "Task Card Design Token",
  "statement": "Visual specification for task cards on the board.",
  "verification": [{ "kind": "observation", "description": "Visual inspection: matches spec" }],
  "status": "approved",
  "pins": [{ "id": "ART-DS-01", "sha256": "0000000000000000000000000000000000000000000000000000000000000000" }],
  "links": { "derived_from": ["ART-DS-01"] }
}
```

## Equivalence Contracts

An equivalence contract formally declares what "same system" means for this graph.

```json
{
  "type": "equivalence_contract",
  "title": "System Equivalence Definition",
  "statement": "Two manifestations are equivalent if all unit tests pass, all integration tests pass, Lighthouse performance scores exceed thresholds, and all constraint nodes are satisfied.",
  "constraints": [
    "Unit test suite must achieve 100% pass rate",
    "Integration tests must cover all behavior nodes",
    "Lighthouse FCP < 1.5s, LCP < 2.5s"
  ],
  "verification": [
    { "kind": "command", "command": "npm test" },
    { "kind": "command", "command": "npm run test:integration" },
    { "kind": "command", "command": "npx lighthouse --preset=perf http://localhost:3000" }
  ]
}
```

## When to Use Extensions

Extensions follow the same minimality test as core types:

> "If I removed this, could a competent implementing agent make a choice I wouldn't want?"

Start with core types. Add extensions when you discover that core types don't provide enough precision for a specific dimension. For most projects, the five core types are sufficient.

### Progressive Addition

A typical extension adoption path:

1. **Start** with core types only (behavior, decision, domain, constraint, feature)
2. **Add `design_token`** when visual inconsistency between features becomes a problem
3. **Add `api_contract`** when service boundaries need formal specification
4. **Add `data_model`** when database schema decisions are load-bearing
5. **Add `equivalence_contract`** when you need reproducible re-manifestation
