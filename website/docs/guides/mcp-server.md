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

## Available Tools

### `init_specgraph`

Creates `specgraph/graph.json` and optionally a root feature.

### `validate_specgraph`

Runs schema validation and structural checks:

- missing targets
- self-references
- `depends_on` cycles

### Query tools

- `list_nodes`
- `get_node`
- `get_feature_subgraph`
- `list_edges`
- `search_nodes`

### Write tools

- `add_node`
- `update_node`
- `remove_node` (with dangling-edge scrubbing)
- `add_edge`
- `remove_edge`

Writes are validated against the canonical Spec Graph JSON Schemas.

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
