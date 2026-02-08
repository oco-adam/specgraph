# Agents Guide — Spec Graph

This file provides context for AI agents working in this repository.

## Repository Structure

```
specgraph/
  research/              # Original research documents (read-only reference)
  previous/              # DLOOP v1 reference material (read-only reference)
  website/               # Docusaurus documentation site
    docs/                # Markdown documentation pages
    static/schemas/      # JSON Schema files (Draft 2020-12)
    static/examples/     # Worked example spec graphs
    src/                 # Site source (React components, CSS)
  .github/workflows/     # CI/CD (GitHub Pages deployment)
```

## Key Concepts

- **Spec Graph**: A directed, typed graph of specification nodes that completely describes a software system.
- **Node types (core)**: `feature`, `behavior`, `decision`, `domain`, `constraint`
- **Node types (extension)**: `design_token`, `ui_contract`, `api_contract`, `data_model`, `artifact`, `equivalence_contract`, `pipeline`
- **Edge types**: `contains`, `depends_on`, `constrains`, `implements`, `derived_from`, `verified_by`, `supersedes`
- **Manifestation**: The process of going from spec graph to running system.

## Schema $id Base URL

All schemas use: `https://oco-adam.github.io/specgraph/schemas/`

## Conventions

- Schemas use JSON Schema Draft 2020-12
- Node IDs use uppercase with hyphens: `AUTH-01`, `DEC-AUTH-01`, `DOM-USER-01`
- Edges are stored inside node files (node-local, forward-only)
- Inverse edges are computed by tooling, never stored

## Validation

Run `node validate.js` from the repo root to validate all examples against schemas.
