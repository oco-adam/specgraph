---
sidebar_position: 6
title: Layer Nodes
---

# Layer Nodes

Layer nodes are **non-normative grouping nodes** for shared horizontal infrastructure. They complement feature nodes.

- `feature`: groups vertical product slices
- `layer`: groups shared platform/infrastructure capability

## Schema

```json
{
  "id": "PLATFORM",
  "type": "layer",
  "title": "Core Platform",
  "description": "Shared infrastructure contracts and platform policies",
  "links": {
    "contains": ["DEC-PLAT-01", "POL-PLAT-SEC-01"]
  }
}
```

## Fields

| Field | Required | Description |
|---|---|---|
| `id` | Yes | Short uppercase identifier (e.g., `PLATFORM`, `DATA`) |
| `type` | Yes | Must be `"layer"` |
| `title` | Yes | Human-readable name (3–100 chars) |
| `description` | Yes | What shared capability this layer covers |
| `links` | No | Outbound edges (typically `contains`, optionally `depends_on`) |
| `metadata` | No | Non-normative context |

## Dependency Rule

Layer dependencies are directional:

- Allowed: `feature -> depends_on -> layer`
- Allowed: `layer -> depends_on -> layer`
- Forbidden: `layer -> depends_on -> feature`

Tooling rejects the forbidden pattern as an inversion error.

## Propagation Semantics

If a node transitively depends on a layer, it receives layer-originated effective guidance:

- decisions in the layer `contains` closure
- applicable constraining nodes (for example policies) that apply to the layer root or descendants under normal `constrains` + `contains` semantics

If a grouping node (feature or layer) depends on a layer, its contained descendants inherit that same propagated layer guidance.

## When to Use a Layer

Use a layer when a capability is shared across multiple features and is architecturally meaningful.

Good candidates:

- `PLATFORM` (shared runtime and gateway decisions)
- `DATA` (shared persistence and consistency rules)
- `DESIGN` (design-system policies and tokens)
- `OBSERVABILITY` (logging/metrics/tracing baseline)

If a decision set is only used by one feature, keep it in that feature instead of creating a layer.
