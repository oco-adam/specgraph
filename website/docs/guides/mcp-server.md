---
sidebar_position: 1
title: MCP Server
---

# MCP Server (`@specgraph/mcp`)

Spec Graph is designed to be **written and consumed primarily by AI agents**.  
Humans should still understand the file format and graph mechanics, but day-to-day authoring is best done through agent tooling.

The recommended interface is the Spec Graph MCP server: [`@specgraph/mcp`](https://www.npmjs.com/package/@specgraph/mcp).

## Why MCP?

With MCP, your coding agent can:

- initialize a new spec graph
- validate graph + nodes
- query nodes/edges/subgraphs
- perform safe graph writes (node/edge add/update/remove)

This gives you structured, graph-aware edits instead of ad-hoc JSON file manipulation.

## Run the Server

```bash
npx @specgraph/mcp --repo-dir /path/to/repo
```

`--repo-dir` should be the repository root that contains your `specgraph/` directory.

## Configure in an MCP Client

Example MCP config:

```json
{
  "mcpServers": {
    "specgraph": {
      "command": "npx",
      "args": ["@specgraph/mcp", "--repo-dir", "."]
    }
  }
}
```

## LLM Context Files

For agent bootstrapping and retrieval workflows, the site publishes both summary and full-context text files:

- [llms.txt](https://oco-adam.github.io/specgraph/llms.txt) — concise overview
- [llms-full.txt](https://oco-adam.github.io/specgraph/llms-full.txt) — complete docs bundle

See [LLM Context Files](/docs/reference/llm-context-files) for usage details.

## Tool Surface (`@specgraph/mcp@0.2.x`)

### Shared Definitions

Most tools use these common field definitions:

- `directory` (optional string): spec graph directory relative to `--repo-dir` (defaults to `specgraph`)
- `node_id`, `feature_id`, `source`, `target`: node IDs with pattern `^[A-Z][A-Z0-9-]{0,79}$`
- `edge_type`: one of `contains`, `depends_on`, `constrains`, `implements`, `derived_from`, `verified_by`, `supersedes`

`add_node` and `update_node` accept `node` as a typed union:

- `feature` requires `id`, `type`, `title`, `description`
- `behavior` requires `id`, `type`, `title`, `expectation`, `verification`
- contract types (`decision`, `domain`, `policy`, `design_token`, `ui_contract`, `api_contract`, `data_model`, `artifact`, `equivalence_contract`, `pipeline`) require `id`, `type`, `title`, `statement`, `verification`

Optional node fields include `links`, `metadata`, and type-specific fields (for example `category`, `severity`, `pins`, `artifact`, `constraints`).

### Initialization and Validation

#### `init_specgraph`

Creates `graph.json` and optionally a root feature node.

Input:

```json
{
  "directory": "specgraph",
  "specgraph_version": "1.0.0",
  "root_feature": {
    "id": "ROOT",
    "title": "Root Feature",
    "description": "Top-level feature for this spec graph."
  }
}
```

#### `validate_specgraph`

Validates graph + nodes against schemas and structural rules.

Input:

```json
{
  "directory": "specgraph"
}
```

Checks include:

- missing targets
- self-references
- `depends_on` cycles

### Query Tools

#### `list_nodes`

Lists node summaries (`id`, `type`, `title`, `status`) plus count.

Input:

```json
{
  "directory": "specgraph"
}
```

#### `get_node`

Returns the full JSON object for one node.

Input:

```json
{
  "directory": "specgraph",
  "node_id": "AUTH-01"
}
```

#### `get_feature_subgraph`

Returns a feature node plus all reachable `contains` descendants.

Input:

```json
{
  "directory": "specgraph",
  "feature_id": "AUTH"
}
```

#### `list_edges`

Lists all graph edges as `{source, target, edge_type}`.

Input:

```json
{
  "directory": "specgraph"
}
```

#### `search_nodes`

Fuzzy-searches on `id`, `title`, `description`, `expectation`, `statement`, and string verifications.

Input:

```json
{
  "directory": "specgraph",
  "query": "token refresh"
}
```

### Write Tools

All writes are validated against canonical Spec Graph JSON Schemas before persistence.

#### `add_node`

Adds a new node. Fails if ID already exists.

Input example:

```json
{
  "directory": "specgraph",
  "node": {
    "id": "AUTH-01",
    "type": "behavior",
    "title": "Reject invalid credentials",
    "expectation": "When credentials are invalid, login is rejected with a generic error.",
    "verification": "npm test -- --grep AUTH-01"
  }
}
```

#### `update_node`

Replaces an existing node.

Important: this is full replacement, not partial patch. Send the complete node object, including all required fields for that node type.

Input example:

```json
{
  "directory": "specgraph",
  "node": {
    "id": "AUTH-01",
    "type": "behavior",
    "title": "Reject invalid credentials",
    "expectation": "When credentials are invalid, login is rejected with a generic error and no user detail leakage.",
    "verification": "npm test -- --grep AUTH-01",
    "constraints": ["Response does not reveal whether username exists"]
  }
}
```

#### `remove_node`

Removes a node and scrubs inbound references from other node link arrays.

Input:

```json
{
  "directory": "specgraph",
  "node_id": "AUTH-01"
}
```

#### `add_edge`

Adds one typed edge from `source` to `target`.

Input:

```json
{
  "directory": "specgraph",
  "source": "AUTH",
  "target": "AUTH-01",
  "edge_type": "contains"
}
```

#### `remove_edge`

Removes one typed edge from `source` to `target`.

Input:

```json
{
  "directory": "specgraph",
  "source": "AUTH",
  "target": "AUTH-01",
  "edge_type": "contains"
}
```

### Backward Compatibility Note

As of `0.2.x`, the server exposes explicit tools listed above.

- removed: `query_specgraph` (operation-dispatch wrapper)
- removed: `write_specgraph` (operation-dispatch wrapper)

## Recommended Workflow

1. Ask your agent to initialize or update the graph through MCP tools.
2. Ask your agent to run `validate_specgraph` after each graph change.
3. Keep manual JSON edits for debugging/learning, not primary authoring.

## Schema Version and Overrides

By default, the MCP package uses bundled canonical schemas.  
For advanced cases, it supports environment overrides:

- `SPECGRAPH_MCP_SCHEMA_DIR`
- `SPECGRAPH_MCP_SCHEMA_BASE_URL`
- `SPECGRAPH_MCP_GRAPH_SCHEMA`
- `SPECGRAPH_MCP_NODE_SCHEMA`
