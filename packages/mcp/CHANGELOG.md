# Changelog

All notable changes to `@specgraph/mcp` are documented in this file.

## 0.2.0 - 2026-02-24

Breaking MCP tool-surface refactor to improve tool schema typing for agents.

### Changed

- Split `query_specgraph` into dedicated tools:
  - `list_nodes`
  - `get_node`
  - `get_feature_subgraph`
  - `list_edges`
  - `search_nodes`
- Split `write_specgraph` into dedicated tools:
  - `add_node`
  - `update_node`
  - `remove_node`
  - `add_edge`
  - `remove_edge`
- Added shared tool input schemas in `src/tools/schemas.ts`, including:
  - typed `NodeInput` discriminated union
  - typed `NodeId`, `EdgeType`, `Links`, and `Metadata`
- Updated server version metadata to `0.2.0`.

### Removed

- `query_specgraph` and `write_specgraph` tool registrations.

## 0.1.0 - 2026-02-23

Initial public release.

### Added

- MCP stdio server package published as `@specgraph/mcp`.
- Core tools:
  - `init_specgraph`
  - `validate_specgraph`
  - `query_specgraph`
  - `write_specgraph`
- Graph layer with:
  - schema loading/validation against canonical Spec Graph JSON Schemas
  - graph loader with in-memory cache
  - structural checks (missing targets, self-edges, `depends_on` cycles)
  - query operations (nodes, edges, feature subgraphs, search)
  - write operations with schema validation and graph/index file management
- Bundled schema assets in package, plus `update-schemas` script for refresh.
- CLI entrypoint:
  - `npx @specgraph/mcp --repo-dir <path>`

### Notes

- Intended as an upstream, generic Spec Graph MCP server for AI agent workflows.
- Manual JSON editing remains supported, but agent-driven graph interaction is the recommended path.
