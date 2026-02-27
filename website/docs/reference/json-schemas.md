---
sidebar_position: 1
title: JSON Schemas
---

# JSON Schemas

All Spec Graph files are validated against JSON Schemas using [JSON Schema Draft 2020-12](https://json-schema.org/specification).

## Schema Files

| Schema | Validates | Required? |
|---|---|---|
| [`graph.schema.json`](pathname:///specgraph/schemas/graph.schema.json) | `graph.json` index file | Yes |
| [`node.schema.json`](pathname:///specgraph/schemas/node.schema.json) | Individual node files | Yes |
| [`graph-index.schema.json`](pathname:///specgraph/schemas/graph-index.schema.json) | Generated edge index | Optional |
| [`manifest-lock.schema.json`](pathname:///specgraph/schemas/manifest-lock.schema.json) | Manifestation lockfile | Optional |

Schema `$id` base URL: `https://oco-adam.github.io/specgraph/schemas/`

## graph.schema.json

Validates the `graph.json` entry point file. Required fields:

- `specgraphVersion` — semver string (e.g., `"1.0.0"`)
- `nodes` — array of node references with `id` and `path`

Optional fields:

- `root` — root node ID
- `nodeSearchPaths` — additional directories to scan
- `defaults` — default values for tooling

### Node References

Each entry in `nodes` has:

```json
{
  "id": "AUTH-01",
  "path": "nodes/behaviors/AUTH-01.json",
  "sha256": "...",          // optional: content hash
  "expectedType": "behavior" // optional: quick type check
}
```

## node.schema.json

Validates individual node files. Uses `oneOf` to distinguish four shapes:

### Feature Nodes

Required: `id`, `type` (= `"feature"`), `title`, `description`

### Layer Nodes

Required: `id`, `type` (= `"layer"`), `title`, `description`

### Behavior Nodes

Required: `id`, `type` (= `"behavior"`), `title`, `expectation`, `verification`

Optional: `constraints` (array)

Authoring convention: include `constraints` explicitly on behavior nodes and use `[]` when none apply. Omission remains schema-valid for backward compatibility.

### Contract Nodes

All other types (decision, domain, policy, and extensions).

Required: `id`, `type`, `title`, `statement`, `verification` (array)

Type-specific requirements:

- `decision` nodes require `category` and `metadata.rationale` (min length 10)
- `policy` nodes require `severity`
- `artifact` nodes require an `artifact` object with a normative `sha256` hash (and optional `source`/`format`)

Other optional fields: `constraints` (array), `links`, `metadata`, `pins` (for derived nodes)

Metadata supports optional `rejected_alternatives` entries (`title` + `reason`) for decision history context.

### The `links` Field

Available on all node types. Supports seven edge types:

```json
"links": {
  "contains": ["..."],
  "depends_on": ["..."],
  "constrains": ["..."],
  "implements": ["..."],
  "derived_from": ["..."],
  "verified_by": ["..."],
  "supersedes": ["..."]
}
```

### Verification Entries

Contract nodes use an array of verification entries. Each entry is either a string or a structured object:

```json
"verification": [
  "npm test -- --grep DEC-AUTH-01",
  {
    "kind": "command",
    "command": "npx tsc --noEmit",
    "timeoutSeconds": 120
  },
  {
    "kind": "http",
    "method": "GET",
    "url": "http://localhost:3000/api/health",
    "expectStatus": 200
  }
]
```

Supported `kind` values: `command`, `http`, `manual`, `observation`, `policy`.

### Node ID Format

Node IDs must match: `^[A-Z][A-Z0-9-]{0,79}$`

Feature IDs must match: `^[A-Z][A-Z0-9-]{0,19}$`

### Node Types

Core: `feature`, `layer`, `behavior`, `decision`, `domain`, `policy`

Extensions: `design_token`, `ui_contract`, `api_contract`, `data_model`, `artifact`, `equivalence_contract`, `pipeline`

## graph-index.schema.json

Validates the optional generated edge index. Required fields:

- `specgraphVersion`
- `generatedFrom` — path (and optional hash) of the source `graph.json`
- `edges` — array of `{ from, type, to }` triples

This file is a **derived artifact**. It should be regenerated from node files and never hand-edited.

## manifest-lock.schema.json

Validates the optional manifestation lockfile. Required fields:

- `specgraphVersion`
- `graph` — path and SHA-256 hash of the manifested graph
- `manifestedAt` — ISO 8601 timestamp

Optional fields:

- `equivalenceContractId` — node ID of the equivalence contract used
- `toolchain` — pinned tool versions
- `artifacts` — resolved artifact hashes
- `checks` — verification results from manifestation

## Validation

Use `ajv` or any JSON Schema Draft 2020-12 compatible validator:

```bash
# Validate a graph index
npx ajv validate -s schemas/graph.schema.json -d specgraph/graph.json

# Validate a node file
npx ajv validate -s schemas/node.schema.json -d specgraph/nodes/behaviors/AUTH-01.json
```

Or use the provided validation script:

```bash
node validate.js
```

For graph-level integrity checks (edges, missing targets, `depends_on` cycles, pins), run:

```bash
node graph_check.js
```
