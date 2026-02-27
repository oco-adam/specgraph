# Changelog

All notable changes to `@specgraph/mcp` are documented in this file.

## 0.4.0 - 2026-02-27

### Added

- Added `layer` as a first-class grouping node type in MCP node input schemas and bundled JSON Schema validation.
- Added `get_group_subgraph` for group traversal across both `feature` and `layer` nodes.
- Added structural validation for layer propagation edge cases:
  - detect ambiguous layer-propagation outcomes
  - reject invalid `depends_on` inversion where a `layer` depends on a `feature`

### Changed

- `list_dependencies_full` now separates informational dependency context from normative, layer-propagated effective guidance.
- `get_effective_constraints` now resolves transitive layer-originated propagation over `depends_on` in addition to direct and inherited `constrains`.
- `get_feature_subgraph` is retained as a backward-compatible alias; `get_group_subgraph` is the preferred tool for grouping traversal.
- Behavior authoring schemas/documentation now clarify that `constraints` should be explicit (use `[]` when none apply).

## 0.3.0 - 2026-02-24

### Added

- New query tools for upstream context and dependency traversal:
  - `get_upstream_context` (alias: `get_affecting_nodes`)
  - `list_dependencies`
  - `list_dependencies_full`
  - `get_effective_constraints`
- Search indexing now includes metadata context (for example rationale and rejected alternatives).

### Changed

- `NodeInput` tool schemas now enforce:
  - `decision.category` is required
  - `decision.metadata.rationale` is required (minimum length)
  - `policy.severity` is required
- Metadata schema now includes optional structured `rejected_alternatives`.

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
