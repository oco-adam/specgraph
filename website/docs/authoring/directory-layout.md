---
sidebar_position: 4
title: Directory Layout
---

# Directory Layout

The Spec Graph uses a file-per-node storage model. Each node is a self-contained JSON file, organized by type.

## Recommended Layout

```
specgraph/
  graph.json                          # Index: version, node list
  nodes/
    features/
      AUTH.json
      TASKBOARD.json
      PLATFORM.json
    behaviors/
      AUTH-01.json
      AUTH-02.json
      TASKBOARD-01.json
    decisions/
      DEC-AUTH-01.json
      DEC-AUTH-02.json
      DEC-TB-01.json
    domains/
      DOM-USER-01.json
      DOM-TASK-01.json
    constraints/
      CON-PERF-01.json
      CON-TB-PERF-01.json
```

## Conventions

### File Naming

Node files are named after their ID:

| Node ID | File Path |
|---|---|
| `AUTH` | `nodes/features/AUTH.json` |
| `AUTH-01` | `nodes/behaviors/AUTH-01.json` |
| `DEC-AUTH-01` | `nodes/decisions/DEC-AUTH-01.json` |
| `DOM-USER-01` | `nodes/domains/DOM-USER-01.json` |
| `CON-PERF-01` | `nodes/constraints/CON-PERF-01.json` |

### Extension Type Directories

Extension types get their own directories:

```
nodes/
  design_tokens/
    DT-TASKCARD-01.json
  api_contracts/
    API-AUTH-01.json
  data_models/
    DM-USER-01.json
```

### The Index File

`graph.json` must reference every node and its path:

```json
{
  "specgraphVersion": "1.0.0",
  "nodes": [
    { "id": "AUTH", "path": "nodes/features/AUTH.json" },
    { "id": "AUTH-01", "path": "nodes/behaviors/AUTH-01.json" },
    { "id": "DEC-AUTH-01", "path": "nodes/decisions/DEC-AUTH-01.json" }
  ]
}
```

Paths are relative to `graph.json`. The path in the index is the **canonical** location — tooling uses this to find node files.

## Why File-Per-Node?

### Atomic PRs

Changing a node and its relationships happens in one file. A PR that adds `DEC-AUTH-01.json` is self-contained and easy to review.

### Reduced Merge Conflicts

In a single-file spec, two people editing different nodes create conflicts. With file-per-node, changes to different nodes never conflict.

### Local Reasoning

When reviewing a node file, you see everything about that node: its statement, constraints, verification, and edges. No need to cross-reference a separate file.

### Tooling Simplicity

Tooling can load, validate, and process individual nodes without parsing the entire graph.

## Optional Files

### `graph.index.json`

A generated flattened edge list for fast traversal. This is a **derived artifact** — the source of truth is always the `links` field in each node file.

```json
{
  "specgraphVersion": "1.0.0",
  "generatedFrom": { "graphPath": "graph.json" },
  "edges": [
    { "from": "AUTH-01", "type": "implements", "to": "DOM-USER-01" },
    { "from": "AUTH-01", "type": "depends_on", "to": "DEC-AUTH-01" }
  ]
}
```

### `manifest.lock.json`

A lockfile capturing the exact graph, artifacts, and toolchain used for a manifestation. Enables reproducible re-manifestation.

## Scaling

For large graphs (100+ nodes), consider organizing by feature:

```
specgraph/
  graph.json
  nodes/
    auth/
      features/AUTH.json
      behaviors/AUTH-01.json
      decisions/DEC-AUTH-01.json
    taskboard/
      features/TASKBOARD.json
      behaviors/TASKBOARD-01.json
```

The index file still lists all nodes — the directory structure is a convention, not a constraint.
