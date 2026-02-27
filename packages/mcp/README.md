# @specgraph/mcp

Node.js MCP server for Spec Graph repositories.

## Usage

```bash
npx @specgraph/mcp --repo-dir /path/to/repo
```

## Environment variables

- `SPECGRAPH_MCP_SCHEMA_DIR`: load `graph.schema.json` and `node.schema.json` from a local directory.
- `SPECGRAPH_MCP_SCHEMA_BASE_URL`: fetch schemas from an alternate base URL.
- `SPECGRAPH_MCP_CACHE_TTL_MS`: cache TTL for loaded graphs (default: `1500`).
- `SPECGRAPH_MCP_DEFAULT_SPECGRAPH_VERSION`: default graph version for `init_specgraph` (default: `1.0.0`).

## Key query tools

- `get_upstream_context` (alias: `get_affecting_nodes`): all upstream nodes that influence a target node, with reason labels.
- `list_dependencies`: direct `depends_on` dependencies.
- `list_dependencies_full`: transitive dependency closure with normative layer-propagated guidance and informational-only dependency context.
- `get_effective_constraints`: direct + inherited constraining nodes plus transitive layer-originated propagation.
- `get_group_subgraph`: grouping-node (`feature` or `layer`) subgraph traversal.
