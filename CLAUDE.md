# Spec Graph Framework

A formal specification framework for predictable, automated, agent-driven software development. The Spec Graph extends behavior-only specifications into a multi-dimensional graph that captures everything required to predictably manifest a system.

## Repository Structure

```
specgraph/
  research/                    # Original research documents (read-only reference)
  previous/                    # DLOOP v1 reference material (read-only reference)
  website/                     # Docusaurus documentation site
    docs/                      # 32 markdown documentation pages
      introduction/            # Introduction, motivation, design principles
      theory/                  # Completeness, minimality, completeness gap, equivalence
      graph/                   # Structure, node types overview, edge types, features
      node-types/              # Behavior, decision, domain, constraint, feature, extensions
      authoring/               # Writing nodes, atomicity, when to add, directory layout
      manifestation/           # Overview, orient-scaffold-implement, context assembly, verification
      guides/                  # Getting started, progressive adoption, from DLOOP v1
      reference/               # JSON schemas, examples, glossary, comparison
    static/schemas/            # JSON Schema files (Draft 2020-12)
    static/examples/           # 3 worked examples (auth, taskboard, minimal)
    src/                       # Site source (React pages, CSS)
  .github/workflows/           # GitHub Pages deployment
  validate.js                  # Schema validation script
  generate_llms_full.js        # LLM artifact generator
  llms-full.txt                # Concatenated docs for LLM consumption
  AGENTS.md                    # Agent context file
```

## Key Decisions

- **5 core node types**: feature, behavior, decision, domain, constraint
- **Extension types**: design_token, ui_contract, api_contract, data_model, artifact, equivalence_contract, pipeline
- **7 edge types** (forward-only): contains, depends_on, constrains, implements, derived_from, verified_by, supersedes
- **Node-local edges**: edges stored inside node files, inverse edges computed by tooling
- **decision type with category field**: merges former "technical" and "stack" types (categories: architecture, stack, pattern, interface)
- **JSON Schema Draft 2020-12**: all schemas use this draft
- **Schema $id base**: https://oco-adam.github.io/specgraph/schemas/

## Commands

```bash
# Build the documentation site
cd website && npm run build

# Validate examples against schemas
node validate.js

# Regenerate LLM artifacts
node generate_llms_full.js

# Dev server
cd website && npm start
```
