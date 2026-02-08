# Spec Graph

A formal specification framework for predictable, automated, agent-driven software development. The Spec Graph captures everything required to predictably manifest a system: behavior, architecture, technology choices, domain concepts, and constraints — as a directed, typed graph of atomic specification nodes.

## Git Workflow

- **`main` is protected** — never commit directly to `main`
- All work must be done on a feature branch
- Create a PR, then merge to `main`
- Branch naming: `<category>/<short-description>` (e.g. `docs/fix-typos`, `feat/new-node-type`, `fix/schema-validation`)

## Repository Structure

```
specgraph/
  website/                       # Docusaurus documentation site
    docs/                        # 32 markdown documentation pages
    static/schemas/              # JSON Schema files (Draft 2020-12)
    static/examples/             # Worked examples (auth, taskboard, minimal)
    src/                         # React pages and CSS
  research/                      # Original research documents (read-only reference)
  previous/                      # DLOOP v1 reference material (read-only reference)
  .github/workflows/deploy.yml   # GitHub Pages deployment
  validate.js                    # Schema validation script
  generate_llms_full.js          # LLM artifact generator
  llms-full.txt                  # Concatenated docs for LLM consumption
```

## Commands

```bash
# Build the documentation site
cd website && npm run build

# Dev server
cd website && npm start

# Validate examples against schemas
node validate.js

# Validate graph integrity (examples)
node graph_check.js

# Regenerate LLM artifacts
node generate_llms_full.js
```

## Key Technical Details

- **5 core node types**: feature, behavior, decision, domain, constraint
- **7 extension types**: design_token, ui_contract, api_contract, data_model, artifact, equivalence_contract, pipeline
- **7 edge types** (forward-only, node-local): contains, depends_on, constrains, implements, derived_from, verified_by, supersedes
- **JSON Schema Draft 2020-12** — requires `ajv/dist/2020` (not plain `ajv`)
- **Docusaurus v3** with `@docusaurus/theme-mermaid`
- Static file links in markdown use `pathname:///` prefix to avoid broken-link errors
- Deploys to GitHub Pages at `oco-adam.github.io/specgraph`
