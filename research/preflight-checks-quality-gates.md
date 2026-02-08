# Preflight Checks & Quality Gates in Spec Graph

> **Status:** Decided
> **Analysis Date:** 2025-02-08
> **Decision Date:** 2026-02-08
> **Context:** Analysis of legacy DLOOP concepts and whether they fit the Spec Graph framework

## Background

The previous DLOOP/TAMM system (see [selfimloop](https://github.com/omnifiedLtd/selfimloop)) implemented a three-stage verification pipeline around every implementation task. This document analyses how those concepts map to the current Spec Graph framework and whether they should be incorporated.

## Legacy DLOOP Verification Pipeline

The DLOOP Implementor agent ran three distinct verification stages during manifestation:

| Stage | When | Purpose | On Failure |
|-------|------|---------|------------|
| **Preflight checks** | Before writing code | Environment health (deps installed, project compiles, dev server running) | Abort immediately |
| **Quality gates** | After writing code, before PR | Code quality (lint, typecheck, format, tests, bundle size) | Fix and retry |
| **Verification** | After quality gates pass | Spec compliance (does the code do what the spec says?) | Fix and retry (3x max) |

All three were tech-stack-specific, defined in "tech stack profiles" and composable with per-project overrides.

### Preflight Checks

Preflight checks verified that the codebase was in a healthy, buildable state *before* the agent began any implementation work. They answered the question: "Is this codebase ready for me to work on?"

Implemented as an MCP tool (`run_preflight_checks`), the system:

- Received a list of checks from the tech stack profile's `toolConfig.preflight.additionalChecks` array
- Iterated through each check, executing shell commands with configurable timeouts
- Tracked pass/fail results with output, errors, and duration
- Had no hardcoded defaults — all checks came from the tech stack profile
- Each check had a `required` flag; only required failures produced blockers
- Could be skipped or disabled entirely per project

**Example checks (Elixir/Phoenix):**
```json
{ "name": "mix-deps",  "command": "test -d deps || mix deps.get",           "required": true,  "timeout": 120000 },
{ "name": "compile",   "command": "mix compile --warnings-as-errors",        "required": true,  "timeout": 180000 },
{ "name": "database",  "command": "mix ecto.status 2>/dev/null || echo 'skip'", "required": false, "timeout": 10000  }
```

**Example checks (Convex + React + Vite):**
```json
{ "name": "node-modules", "command": "test -d node_modules || npm install", "required": true,  "timeout": 120000 },
{ "name": "convex-dev",   "command": "pgrep -f 'convex dev' > /dev/null || echo 'Warning'", "required": false, "timeout": 5000 }
```

### Quality Gates

Quality gates were code quality checks that ran *after* the agent finished implementing but *before* a PR was created. They answered: "Does the code I just wrote meet the project's quality standards?"

Implemented as an MCP tool (`run_quality_gates`), the system:

- Supported two categories: `fast` (lint, typecheck) and `slow` (tests, full builds)
- Ran fast gates first for quick feedback
- Used `failFast` behaviour (stop after first required failure)
- Expected the agent to fix failures, recommit, and re-run until gates passed

**Example gates (Elixir/Phoenix):**
```json
{ "name": "format",    "command": "mix format --check-formatted",        "required": true,  "category": "fast", "timeout": 30000  },
{ "name": "test",      "command": "mix test",                            "required": true,  "category": "slow", "timeout": 300000 },
{ "name": "playwright","command": "npx playwright test --reporter=list", "required": false, "category": "slow", "timeout": 300000 }
```

**Custom gates** could be added per-project:
```json
{ "name": "Bundle Size",   "command": "npm run check:bundle-size", "required": true  },
{ "name": "License Check", "command": "npm run check:licenses",    "required": false }
```

### Verification (Spec Compliance)

Verification checked whether the implementation actually satisfied the spec's stated behaviour, invariant, and verification criteria. It answered: "Does the code do what the spec says it should?"

The verification tool loaded the spec, parsed verification criteria into executable steps, and supported up to 3 retries for transient failures. The original architecture called for a "verifier subagent" with fresh context to avoid confirmation bias.

### Composition Architecture

All three stages were configured through a three-layer composition system:

1. **Layer 1 (Base):** Core agent workflow instructions
2. **Layer 2 (Tech Stack Profile):** Which checks/gates apply for a given technology
3. **Layer 3 (Project Overrides):** Per-project additions, exclusions, or replacements

The composition engine supported additive composition, exclusion lists, and override-by-name.

### Spec Manager Atomicity Gate

The Spec Manager agent also had its own quality gate — an atomicity check before writing specs:

| Check | Limit | Action |
|-------|-------|--------|
| Expectation length | > 200 chars | REJECT |
| Invariant length | > 100 chars | REJECT |
| Verification length | > 150 chars | REJECT |
| Multiple "and" + verbs | detected | REJECT |
| Conditional logic (if/when) | detected | REJECT |

## What Spec Graph Already Covers

### Verification (Stage 3) — Fully Covered

Every normative node has a `verification` field. Constraint nodes cross-cut behaviours via `constrains` edges. The manifestation workflow explicitly gates progress on verification passing. This is the core strength of the framework.

### Quality Standards — Partially Covered

Quality standards can be modelled as constraint nodes with executable verification commands:
- `"All code must pass type checking"` → constraint node
- `"Bundle size < 200KB"` → constraint node with command verification
- System-wide quality bar → equivalence contract

### What's NOT Currently Covered

- **Preflight checks** — environment readiness before manifestation begins
- **Tech-stack-specific quality gate orchestration** — fast/slow categorisation, timeouts, required vs optional flags, fail-fast behaviour
- **Gate execution strategy** — run lint before tests, abort early on required failures

## Analysis: Do They Belong in the Spec Graph?

### Arguments Against Inclusion

**1. The spec graph is a specification of the system, not the development process.**

Preflight checks ("are deps installed?") and quality gates ("run the linter") are concerns of the agent workflow, not properties of the system being built. The spec graph answers "what system should exist and how do we know it's correct?" — not "what does the agent's workspace need to look like before it starts?"

**2. They're already implied by existing node types.**

A decision node like `DEC-STACK-01: "Use Elixir/Phoenix with mix"` already tells the agent what toolchain it's working with. A constraint node like `CON-QUALITY-01: "All code must pass mix format --check-formatted"` already captures the quality standard. The agent should derive operational checks from these declarative statements.

**3. Procedural steps in a declarative graph create a category mismatch.**

Preflight checks are inherently procedural ("run this command, check the exit code, abort if non-zero"). The spec graph is declarative ("this property must hold"). Mixing the two muddies the framework's conceptual clarity.

### Arguments For Inclusion

**1. Completeness of the specification.**

If the spec graph claims to capture "everything required to predictably manifest a system," then the quality assurance pipeline is part of that picture.

**2. Reproducibility across agents.**

Different agents might apply different quality standards if the graph doesn't specify them. Including quality gates makes manifestation more deterministic.

**3. The `pipeline` extension node type exists.**

The framework already has a `pipeline` node for build/deploy processes. Quality gates could be modelled as pipeline stages.

## Recommendation

### Use What Already Exists

| Concern | Spec Graph Home |
|---------|-----------------|
| Quality standards ("code must be formatted") | Constraint nodes |
| Toolchain choices ("use ESLint with strict config") | Decision nodes |
| Aggregate quality bar | Equivalence contract |
| Build/deploy pipeline | Pipeline extension node |

### Leave Operational Machinery to the Agent Layer

| Concern | Where It Belongs |
|---------|------------------|
| Preflight checks (environment readiness) | Agent/tooling configuration |
| Gate execution order (fast before slow) | Agent strategy |
| Timeouts, retries, fail-fast behaviour | Agent configuration |
| Tech stack profiles and composition | Agent configuration |

### Mapping Summary

| Legacy Concept | Spec Graph Home | Rationale |
|----------------|-----------------|-----------|
| Verification (spec compliance) | Behaviour/constraint `verification` fields | Already there — core value proposition |
| Quality standards | Constraint nodes | System properties, belong in the graph |
| Quality gate execution | Agent/tooling layer | Operational procedure, not system spec |
| Preflight checks | Agent/tooling layer | Development environment concern |
| Tech stack profiles | Decision nodes (declarative) + agent config (operational) | Split the what from the how |

### Possible Future Extension: Manifestation Profile

If real-world usage shows that decision + constraint nodes aren't sufficient guidance for agents, a lightweight **manifestation profile** could be added as metadata on the graph root — explicitly informative (not normative), serving as hints to the agent layer:

```json
{
  "manifestation": {
    "preflight": ["Verify dev dependencies are installed", "Verify dev server is accessible"],
    "qualityGates": ["Run formatter", "Run type checker", "Run test suite"],
    "notes": "Operational hints for manifesting agents, not system specifications."
  }
}
```

This would only be worth adding if practice demonstrates the need.

## Decision

### Decision (TRU-DE / DLOOP v2)

**Preflight checks and quality-gate orchestration are not modeled as normative Spec Graph content.** They live in the TRU-DE (DLOOP v2) agent/tooling layer.

### What *is* modeled in the Spec Graph

- **Quality standards** are modeled as `constraint` nodes (`severity: hard|soft`) with explicit `verification` entries.
- **System-level “definition of done”** lives in an `equivalence_contract` node (or as a small set of global hard constraints) so “passes gates” is a property of the system spec, not an implicit agent habit.

### What stays in TRU-DE tooling

- **Preflight**: environment readiness before writing (deps, buildability, git cleanliness, services running).
- **Gate strategy**: fast/slow ordering, fail-fast behavior, retries, timeouts defaults, parallelism, and stack-specific command selection.

### Practical Mapping (Recommended)

1. **Hard quality gate** = `constraint(severity=hard)` with `verification.kind=command` (or referenced by an `equivalence_contract`).
2. **Optional gate** = `constraint(severity=soft)` with verification.
3. **Fast vs slow** = `metadata.tags` on constraint nodes (informative); TRU-DE uses tags to order execution.
4. **Preflight** = TRU-DE “execution profile” selected from graph `decision(category=stack)` nodes plus per-project overrides.

### Why This Split

- Keeps the Spec Graph declarative and about **system properties** (what must be true).
- Keeps TRU-DE responsible for **operational procedure** (how/when to run checks).
- Still yields reproducible manifestation via:
  - Explicit `verification` commands in nodes
  - `manifest.lock.json` recording check execution + toolchain versions

### Notes From DLOOP v1 Implementation (selfimloop)

The current DLOOP v1 codebase implements these concepts as **agent tooling**, not as spec content:

- Preflight is implemented as the MCP tool `run_preflight_checks` and a shell script `scripts/dloop-preflight.sh`.
- The orchestrator/runner can execute preflight before invoking the main agent, and can optionally spawn a bounded “preflight auto-fix” sub-run when a *required* check fails (then re-run the check).
- Quality gates are implemented as the MCP tool `run_quality_gates`, with `category: fast|slow`, `required` flags, and `failFast` behavior.
- Both are configured via a **tech stack profile** `toolConfig` object (e.g. `toolConfig.preflight.additionalChecks`, `toolConfig.qualityGates.gates`), with “no defaults” to avoid stack-specific commands leaking into other stacks.

This is consistent with keeping preflight and orchestration in TRU-DE tooling while making the *normative* quality bar explicit in the spec graph.

### Guidance For Agent/Tooling Designers (TRU-DE)

Use three distinct stages with distinct semantics:

1. **Preflight (environment readiness, before writing)**
   - Goal: avoid wasting implementation time/tokens in a broken workspace.
   - Inputs: “execution profile” (stack-specific checks) + project overrides.
   - Outputs: structured per-check results (name, passed, required, duration, output).
   - Failure policy: if any *required* check fails, abort before any implementation.
   - Optional: allow a bounded “auto-fix” mode that ONLY addresses the failing check, then re-runs it.
   - Avoid duplication: run preflight once (ideally in the orchestrator) and have any in-agent `run_preflight_checks` return cached results unless explicitly forced.

2. **Quality gates (code quality, after changes, before PR)**
   - Goal: enforce the project’s quality bar (format/lint/typecheck/tests/bundle-size/security/etc).
   - Source of truth for *what must pass* should be Spec Graph nodes:
     - Prefer `constraint` nodes with `severity: hard|soft` and explicit `verification` commands.
     - Optionally aggregate these into an `equivalence_contract` node that defines “definition of done”.
   - Orchestration stays in tooling:
     - Run `fast` gates early and often; run `slow` gates before PR (and again in CI).
     - Use fail-fast for required gates for feedback speed.
     - Treat `soft` constraints as non-blocking but visible.
   - Avoid drift: reviewers/CI should run the same gate set (or a superset) as implementors.

3. **Verification (spec compliance)**
   - Goal: prove the change satisfies the behavior/decision/domain/constraint nodes it touched.
   - Policy: retries are acceptable for flaky external dependencies, but cap attempts and record outcomes in the lockfile.

#### Recommended Contract Between Spec Graph and Tooling

- **Spec Graph (normative):**
  - `constraint` nodes encode the required quality properties and their verifications.
  - `equivalence_contract` encodes system-level equivalence / “done”.
- **TRU-DE tooling (operational):**
  - Selects a stack execution profile from `decision(category=stack)` nodes (plus overrides).
  - Maps constraint verifications into runnable commands, applies timeouts, parallelism, and ordering.
  - Writes a `manifest.lock.json` entry recording which checks were executed and their status.
