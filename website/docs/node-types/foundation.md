---
sidebar_position: 7
title: Foundation Nodes
---

# Foundation Nodes

Foundation nodes describe the persistent, foundational structural realities of a repository. They declare that mandatory scaffolding, package configuration, and baseline file structure are manifested and available before application logic is implemented.

## Schema

```json
{
  "$schema": "https://oco-adam.github.io/specgraph/schemas/node.schema.json",
  "id": "FND-GO-MOD",
  "type": "foundation",
  "title": "Go Module Manifestation",
  "statement": "The repository contains a valid Go module identified as 'github.com/oco-adam/todoist-clone', satisfying the Go runtime requirements of the platform.",
  "verification": [
    "test -f go.mod",
    "grep -q 'module github.com/oco-adam/todoist-clone' go.mod"
  ],
  "links": {
    "depends_on": ["DEC-PLAT-01"]
  },
  "metadata": {
    "rationale": "Provides the Go module anchor that all subsequent Go source files and packages depend on."
  }
}
```

## Fields

| Field | Required | Description |
|---|---|---|
| `id` | Yes | Unique identifier (pattern: `FND-*`) |
| `type` | Yes | Must be `"foundation"` |
| `title` | Yes | Short name (3-140 chars) |
| `statement` | Yes | Declarative truth about manifested filesystem state. Must not use imperative verbs. |
| `verification` | Yes | Array of self-contained shell commands (min 1). No project test runners. |
| `constraints` | No | Additional structural conditions |
| `links` | No | Outbound edges. `depends_on` targets must be `decision`, `policy`, or `foundation` only. |
| `metadata` | No | Non-executable context |

## The Cold Start Problem

In a greenfield repository, abstract decisions alone do not provide physical implementation anchors. A decision such as "the backend is written in Go" can still lead an agent to produce incorrect scaffolding if no concrete repository baseline exists.

Foundation nodes close that gap. They declare a concrete baseline state, such as module manifests, workspace configuration, and required directories, so downstream manifestation starts from explicit physical reality instead of inference.

## Verification Command Rules

Foundation verification commands must be self-contained shell checks against repository state.

- Use file/directory/content checks such as `test -f`, `test -d`, and `grep -q`
- Do not use project test runners (`npm test`, `go test`, `pytest`) for foundation verification
- For structured verification entries, use `"kind": "command"` exclusively

## Agent Implementation Expectations

Foundation manifestation should be idempotent and convergent:

- The declared filesystem state exists after processing
- Existing compliant state is preserved
- Conflicting state is converged to match the declaration
- Application behavior logic and test suites are not created as part of foundation work

### Orchestrator Dispatch Rules

Resolve foundation nodes before dispatching dependent `layer`, `feature`, or `behavior` nodes.

Recommended ordering:

1. `decision` / `policy` nodes
2. `foundation` nodes
3. `layer` / `feature` / `behavior` nodes

## Dependency Rule

- Allowed: `foundation -> depends_on -> decision`
- Allowed: `foundation -> depends_on -> policy`
- Allowed: `foundation -> depends_on -> foundation`
- Forbidden: `foundation -> depends_on -> layer`
- Forbidden: `foundation -> depends_on -> feature`
- Forbidden: `foundation -> depends_on -> behavior`

Tooling rejects forbidden dependencies.

## Foundation vs. Decision

| Characteristic | `decision` Node | `foundation` Node |
|---|---|---|
| Semantic role | Abstract architectural constraint or rule | Concrete, manifested physical repository state |
| Example title | "Go Backend" | "Go Module Manifestation" |
| Example statement | "The backend application must be written in Go." | "The repository contains a valid go.mod file." |
| Verification style | Constraint checks, linting, architecture checks | Structural shell checks (`test -f`, `grep -q`) |
| Agent action | Constrains downstream implementation choices | Creates and converges baseline scaffolding |

## When to Use a Foundation Node

Create a foundation node when:

- The repository is empty or greenfield and needs physical bootstrap state
- A new language ecosystem must be initialized before behavior implementation
- A monorepo workspace boundary must be declared and verified
- Mandatory directory or manifest structure must exist before application logic

## ID Conventions

Use `FND-*` or `FND-SCOPE-*` identifiers.

Examples:

- `FND-GO-MOD`
- `FND-GO-DIRS`
- `FND-NPM-WORKSPACE`

## Anti-Patterns

- Imperative statements ("Initialize the Go module") instead of declarative state
- Using project test runners as foundation verification
- Mixing domain/application logic into foundation statements
- Depending on `layer`, `feature`, or `behavior` nodes
- Stating "build success" instead of concrete manifested structure

## Examples

### Example 1: Go Module Initialization

```json
{
  "id": "FND-GO-MOD",
  "type": "foundation",
  "title": "Go Module Manifestation",
  "statement": "The repository contains a valid Go module identified as 'github.com/oco-adam/todoist-clone', satisfying the Go runtime requirements of the platform.",
  "verification": [
    "test -f go.mod",
    "grep -q 'module github.com/oco-adam/todoist-clone' go.mod"
  ],
  "links": {
    "depends_on": ["DEC-PLAT-01"]
  },
  "metadata": {
    "rationale": "Provides the Go module anchor that all subsequent Go source files and packages depend on."
  }
}
```

### Example 2: Standard Go Directory Layout

```json
{
  "id": "FND-GO-DIRS",
  "type": "foundation",
  "title": "Standard Go Directory Layout",
  "statement": "The repository adheres to the standard Go project layout, providing distinct 'cmd/', 'internal/', and 'pkg/' directories for structural separation of concerns.",
  "verification": [
    "test -d cmd",
    "test -d internal",
    "test -d pkg"
  ],
  "links": {
    "depends_on": ["FND-GO-MOD", "DEC-ARCH-01"]
  }
}
```

### Example 3: NPM Workspace Configuration

```json
{
  "id": "FND-NPM-WORKSPACE",
  "type": "foundation",
  "title": "NPM Workspace Initialization",
  "statement": "The project is structured as an NPM workspace containing a 'packages' directory and a root package.json defining the workspace boundary.",
  "verification": [
    "test -f package.json",
    "test -d packages",
    "node -e \"const pkg = require('./package.json'); if (!pkg.workspaces || !pkg.workspaces.includes('packages/*')) process.exit(1);\""
  ],
  "links": {
    "depends_on": ["DEC-MONOREPO-01"]
  }
}
```

### Example 4: Python Project Configuration

```json
{
  "id": "FND-PY-PROJECT",
  "type": "foundation",
  "title": "Python Project Manifestation",
  "statement": "The repository contains a valid pyproject.toml with the project name 'my-service' and a src/ layout for package sources.",
  "verification": [
    "test -f pyproject.toml",
    "grep -q 'name = \"my-service\"' pyproject.toml",
    "test -d src/my_service"
  ],
  "links": {
    "depends_on": ["DEC-PLAT-01"]
  }
}
```
