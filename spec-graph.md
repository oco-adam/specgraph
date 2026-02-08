# The Spec Graph: Total System Specification

> **A framework for declarative specifications that capture everything required to predictably manifest a system.**

---

## Table of Contents

- [1. Motivation](#1-motivation)
- [2. Core Concepts](#2-core-concepts)
- [3. The Spec Graph](#3-the-spec-graph)
- [4. Node Types](#4-node-types)
- [5. Edge Types](#5-edge-types)
- [6. Formal Properties](#6-formal-properties)
- [7. The Manifestation Process](#7-the-manifestation-process)
- [8. Practical Authoring](#8-practical-authoring)
- [9. Split Architecture: Flat Nodes + RDF Graph](#9-split-architecture-flat-nodes--rdf-graph)
- [10. Format & Schema](#10-format--schema)
- [11. Migration from SPEC.json v1](#11-migration-from-specjson-v1)
- [12. Extended Example](#12-extended-example)

---

## 1. Motivation

### The Problem with Behavior-Only Specs

DLOOP v1 established a declarative spec as the "constitution" for a project. Each behavior describes **WHAT** the system should do — one trigger, one behavior, one outcome. This works well for capturing observable system behavior, but it leaves critical information stranded in implicit side-channels:

| What's Missing | Where It Lives Today | Why It Matters |
|---|---|---|
| Architectural patterns | Agent instructions, tech stack profiles | Two agents given the same behavioral spec may produce architecturally incompatible implementations |
| Design system | Scattered docs, component libraries, agent prompts | Visual consistency requires shared design knowledge that behaviors don't capture |
| Technology choices | Tech stack profiles, CLAUDE.md, package.json | "Build a login form" manifests very differently in Next.js vs. Phoenix LiveView |
| Domain model | Implicit in code, sometimes in docs | Business concepts and their relationships constrain valid implementations |
| Performance/security budgets | Constraint nodes in agent instructions | Non-functional requirements shape every implementation decision |
| Senior engineer guidance | Ad-hoc PR comments, agent instruction tweaks | Critical technical insights get lost or trapped in mutable, unversioned locations |

**The consequence:** When you re-manifest a system from its behavioral spec alone, you get a system that does the right things but may do them in incompatible, inconsistent, or suboptimal ways. The spec is _necessary_ but not _sufficient_ for deterministic manifestation.

### The Goal

Define a specification framework — the **Spec Graph** — with this property:

> **The Spec Graph is the minimal structure that, when processed by a capable implementing agent, will always produce logically equivalent manifestations of the designer's intended system.**

"Logically equivalent" means: the same observable behaviors, the same architectural properties, the same design characteristics, and the same domain semantics — across every dimension the designer has specified.

---

## 2. Core Concepts

### Manifestation

**Manifestation** is the process of going from specification to running system. It encompasses all intermediate steps: designing, planning, coding, building, testing, and deploying. A spec is "manifested" when it exists as a working system.

```
Spec Graph  →  [Manifest]  →  Running System
     G              A               M

Where:
  G = the spec graph
  A = the implementing agent (or team of agents)
  M = the manifested system
```

### Completeness

A Spec Graph G is **complete** with respect to an implementing agent A if, for any two manifestations M₁ and M₂ that A could produce from G:

```
M₁ ≡ M₂   (logically equivalent across all specified dimensions)
```

Intuitively: no matter how many times you manifest from the same spec, you get the "same" system. The agent has no ambiguous decisions left to make on dimensions the designer cares about.

**What "equivalent" means depends on what's specified.** If the spec only covers behavior, then equivalence is only behavioral — the architecture could differ wildly. If the spec also covers architecture, then architectural equivalence is also required. The Spec Graph aims to cover _every dimension the designer intends to control_.

### Minimality

The Spec Graph should be **minimal**: removing any node would make manifestation non-deterministic on some dimension the designer cares about.

```
∀ node n ∈ G:
  ∃ M₁, M₂ ∈ Manifest(G \ {n}, A):
    M₁ ≢ M₂
```

In plain English: every node in the graph is load-bearing. If you can remove a node and still get deterministic manifestation, that node was redundant and shouldn't be there.

This is analogous to a **basis** in linear algebra — the minimal set of vectors that spans the space. The Spec Graph is the minimal set of specifications that spans the designer's "intent space."

### The Minimality Test

For any proposed spec node, ask:

> "If I removed this, could a competent implementing agent make a choice I wouldn't want?"

If yes → the node is load-bearing, keep it.
If no → the node is redundant, remove it.

---

## 3. The Spec Graph

### Structure

The Spec Graph is a **directed, typed, multi-layer graph** where:

- **Nodes** are individual specification entries, each with a type
- **Edges** are typed relationships between nodes
- **Features** are namespaces that group related nodes across types

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SPEC GRAPH                                    │
│                                                                      │
│  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐     │
│  │   DOMAIN    │───────►│  BEHAVIOR   │◄───────│  TECHNICAL  │     │
│  │   nodes     │ impl.  │   nodes     │ guides │   nodes     │     │
│  └──────┬──────┘        └──────┬──────┘        └──────┬──────┘     │
│         │                      │                      │             │
│         │ constrains           │ uses                 │ requires    │
│         ▼                      ▼                      ▼             │
│  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐     │
│  │ CONSTRAINT  │        │   DESIGN    │        │   STACK     │     │
│  │   nodes     │        │   nodes     │        │   nodes     │     │
│  └─────────────┘        └─────────────┘        └─────────────┘     │
│                                                                      │
│  ════════════════════════════════════════════════════════════════    │
│  Features: AUTH, DASHBOARD, PAYMENTS, ...                           │
│  (namespace groupings that cut across all node types)               │
└─────────────────────────────────────────────────────────────────────┘
```

### Why a Graph?

A flat list (SPEC.json v1) forces everything into one dimension. Real systems have multiple interacting dimensions:

| Dimension | Question It Answers | Node Type |
|---|---|---|
| **Behavioral** | What does the system do? | `behavior` |
| **Structural** | How is it organized? | `technical` |
| **Visual** | How does it look and feel? | `design` |
| **Technological** | What is it built with? | `stack` |
| **Conceptual** | What domain concepts does it model? | `domain` |
| **Operational** | What constraints must it satisfy? | `constraint` |

The graph captures not just the specifications in each dimension, but the **relationships between them**. A behavioral spec can reference the technical pattern that guides its implementation, the design tokens it uses, and the domain concepts it models.

---

## 4. Node Types

Every node in the Spec Graph has a **type** that determines its schema and semantics. All nodes share a common base:

```
Common fields (all node types):
  - id:           Unique identifier (TYPE-FEATURE-##)
  - type:         Node type enum
  - feature:      Feature namespace this belongs to
  - name:         Short human-readable name
  - rationale:    Why this node exists (optional but encouraged)
  - edges:        Typed references to other nodes
```

### 4.1 Behavior Nodes

**What they specify:** Observable system behavior from the user's perspective.

These are the existing v1 specs, carried forward unchanged. They remain the core of the graph — everything else exists to support deterministic manifestation of behaviors.

```json
{
  "type": "behavior",
  "id": "AUTH-01",
  "feature": "AUTH",
  "name": "Login Form Display",
  "expectation": "Login page renders email and password input fields with a submit button",
  "invariant": "Password field must mask input characters",
  "verification": "npm test -- --grep AUTH-01"
}
```

Edges (guided-by, uses, implements, etc.) are stored in `SPEC.graph.jsonld` — see [Section 9](#9-split-architecture-flat-nodes--rdf-graph).

| Field | Description | Limit |
|---|---|---|
| `expectation` | What happens, from the user's perspective | 200 chars |
| `invariant` | Constraint that must always be true, or "None" | 100 chars |
| `verification` | How to verify (prefer executable commands) | 150 chars |
| `edges` | References to guiding/constraining nodes | — |

**The ONE Rule still applies:** ONE trigger, ONE behavior, ONE outcome.

### 4.2 Technical Nodes

**What they specify:** Architectural guidance, design patterns, implementation strategies — the "how" that a senior engineer would provide.

Technical nodes capture knowledge that would otherwise live in agent instructions, tech stack profiles, PR review comments, or a senior engineer's head. They are **imperative by nature** — they tell the implementor _how_ to build, not just _what_ to build.

```json
{
  "type": "technical",
  "id": "TECH-AUTH-01",
  "feature": "AUTH",
  "name": "Abstract Auth Provider Interface",
  "guidance": "All authentication operations must go through an abstract AuthProvider interface. Concrete implementations include ClerkProvider (production) and DeterministicProvider (testing). The interface must define: authenticate(credentials), validateSession(token), and revokeSession(token).",
  "rationale": "Enables deterministic testing of auth flows without hitting external services. Allows future provider swaps without changing consuming code.",
  "invariant": "No auth operation may bypass the AuthProvider interface",
  "verification": "npx tsc --noEmit (interface exists, all auth calls use it)"
}
```

Edges (`guides`, `requires`) are stored in the graph file.

| Field | Description | Limit |
|---|---|---|
| `guidance` | What to do and how — imperative, specific, actionable | 500 chars |
| `rationale` | Why this technical decision was made | 300 chars |
| `invariant` | Architectural constraint that must hold | 150 chars |
| `verification` | How to verify the pattern is followed | 150 chars |

**When to create a technical node:**
- A senior engineer would give this guidance to a junior developer
- Without this guidance, two implementations might be structurally incompatible
- The guidance captures a non-obvious decision that affects system quality
- A specific pattern is required for testability, performance, or maintainability

**The atomicity rule for technical nodes:** ONE pattern, ONE decision, ONE constraint. If guidance covers multiple patterns, split into multiple nodes.

### 4.3 Design Nodes

**What they specify:** Visual language, UX patterns, design tokens — everything needed for consistent visual manifestation.

```json
{
  "type": "design",
  "id": "DESIGN-COLOR-01",
  "feature": "DESIGNSYSTEM",
  "name": "Primary Color Palette",
  "specification": "Primary: oklch(59.59% 0.24 275.75). Primary-foreground: oklch(96.27% 0.01 275.75). Primary-hover: oklch(52.85% 0.24 275.75). Use primary for all interactive elements (buttons, links, focus rings).",
  "rationale": "Consistent brand identity across all surfaces",
  "invariant": "All interactive elements must use the primary palette",
  "verification": "CSS audit: no hardcoded colors outside the token system"
}
```

| Field | Description | Limit |
|---|---|---|
| `specification` | Precise design values and usage rules | 500 chars |
| `rationale` | Why these design choices were made | 300 chars |
| `invariant` | Design constraint that must hold | 150 chars |
| `verification` | How to verify visual compliance | 150 chars |

**Design node categories:**
- **Tokens** — Colors, typography, spacing, shadows, radii
- **Components** — Button styles, form patterns, card layouts
- **Patterns** — Navigation structures, page layouts, responsive breakpoints
- **Motion** — Animation timing, transition curves, interaction feedback

### 4.4 Stack Nodes

**What they specify:** Technology choices, dependencies, infrastructure — the technological foundation.

```json
{
  "type": "stack",
  "id": "STACK-FRAMEWORK-01",
  "feature": "INFRASTRUCTURE",
  "name": "Next.js 14 App Router",
  "choice": "Next.js 14 with App Router",
  "constraints": [
    "Use App Router exclusively (not Pages Router)",
    "Server components by default, client components only when state/interactivity needed",
    "No API routes — use Convex functions for all backend logic"
  ],
  "rationale": "Server components for performance, established patterns for auth and routing",
  "verification": "package.json contains next@14, no pages/ directory exists"
}
```

| Field | Description | Limit |
|---|---|---|
| `choice` | The technology chosen | 200 chars |
| `constraints` | Rules for using this technology | Array, each ≤200 chars |
| `rationale` | Why this technology was chosen | 300 chars |
| `verification` | How to verify the choice is respected | 150 chars |

**Stack nodes answer:** "What are we building with, and what are the rules for using it?"

### 4.5 Domain Nodes

**What they specify:** Business concepts, their properties, relationships, and rules — the ubiquitous language of the system.

```json
{
  "type": "domain",
  "id": "DOMAIN-USER-01",
  "feature": "AUTH",
  "name": "User Account",
  "definition": "A registered entity that can authenticate, own resources, and have role-based permissions within a project",
  "properties": [
    "email: string (unique identifier, immutable after creation)",
    "displayName: string (user-chosen, mutable)",
    "role: enum(owner, admin, member) per project"
  ],
  "rules": [
    "A user must have exactly one role per project they belong to",
    "Email uniqueness is enforced at the database level"
  ],
  "invariant": "Every user must have a verified email before accessing any resource",
  "verification": "Database schema enforces email uniqueness; auth middleware checks verification"
}
```

Edges (`implemented-by`, `related-to`) are stored in the graph file.

| Field | Description | Limit |
|---|---|---|
| `definition` | What this concept is in the business domain | 300 chars |
| `properties` | Named, typed attributes of this concept | Array, each ≤200 chars |
| `rules` | Business rules governing this concept | Array, each ≤200 chars |
| `invariant` | Domain constraint that must always hold | 150 chars |
| `verification` | How to verify the domain model is correct | 150 chars |

**Domain nodes establish shared vocabulary.** When a behavioral spec says "user," both the spec author and the implementing agent agree on exactly what "user" means.

### 4.6 Constraint Nodes

**What they specify:** Non-functional requirements that cut across features — performance budgets, security policies, accessibility standards.

```json
{
  "type": "constraint",
  "id": "CONSTRAINT-PERF-01",
  "feature": "INFRASTRUCTURE",
  "name": "API Response Time Budget",
  "requirement": "All API endpoints must respond within 500ms at p95 under normal load (< 100 concurrent users)",
  "rationale": "User experience research shows perceived responsiveness drops sharply above 500ms",
  "severity": "hard",
  "invariant": "No endpoint may exceed 500ms p95 in production",
  "verification": "Load test: k6 run --vus 100 --duration 60s perf-test.js"
}
```

Edges (`constrains`) are stored in the graph file.

| Field | Description | Limit |
|---|---|---|
| `requirement` | What must be true, with measurable criteria | 300 chars |
| `rationale` | Why this constraint exists | 300 chars |
| `severity` | `hard` (blocks manifestation) or `soft` (quality target) | enum |
| `invariant` | The enforceable form of the constraint | 150 chars |
| `verification` | How to measure compliance | 150 chars |

**Constraint categories:**
- **Performance** — Latency, throughput, resource usage
- **Security** — Authentication, authorization, data protection
- **Accessibility** — WCAG compliance, keyboard navigation, screen reader support
- **Reliability** — Uptime, error rates, recovery time
- **Cost** — Cloud spend limits, API call budgets

---

## 5. Edge Types

Edges encode the relationships between nodes. They are the connective tissue that makes the graph more than a collection of lists.

### Relationship Types

| Edge Type | From → To | Meaning |
|---|---|---|
| `guides` | technical → behavior | "This pattern guides how this behavior should be implemented" |
| `guided-by` | behavior → technical | Inverse of `guides` |
| `constrains` | constraint/design → any | "This constraint limits how this can be manifested" |
| `constrained-by` | any → constraint/design | Inverse of `constrains` |
| `depends-on` | any → any | "This must be manifested before I can be manifested" |
| `required-by` | any → any | Inverse of `depends-on` |
| `implements` | behavior → domain | "This behavior realizes part of this domain concept" |
| `implemented-by` | domain → behavior | Inverse of `implements` |
| `uses` | behavior → design/stack | "This behavior uses this design element or technology" |
| `used-by` | design/stack → behavior | Inverse of `uses` |
| `requires` | technical → stack | "This pattern requires this technology" |
| `refines` | any → any (same type) | "This is a more specific version of that" |
| `related-to` | any → any | "These are conceptually related" (weakest edge) |

### Edge Storage

Edges are stored in a separate **graph file** (`SPEC.graph.jsonld`), not inline in SPEC.json. This keeps the flat node file simple and the graph structure cleanly separated (see [Section 9: Split Architecture](#9-split-architecture-flat-nodes--rdf-graph)).

In the graph file, each node that has edges is listed with its forward relationships:

```json
{
  "@context": "./spec-graph.context.jsonld",
  "@graph": [
    {
      "id": "AUTH-01",
      "guided-by":      ["TECH-AUTH-01"],
      "uses":            ["DESIGN-FORM-01"],
      "implements":      ["DOMAIN-USER-01"],
      "constrained-by":  ["CONSTRAINT-PERF-01"]
    }
  ]
}
```

Inverse edges are **computed, not stored**. Tooling derives them from forward edges. This keeps the graph DRY — each relationship is declared once on the node where it's most natural.

### Edge Validation Rules

1. **Referential integrity**: Every edge target must exist in the graph
2. **Type compatibility**: Edge types constrain which node types can be connected (see table above)
3. **No self-references**: A node cannot edge to itself
4. **Acyclicity for `depends-on`**: Dependency chains must not form cycles

---

## 6. Formal Properties

### 6.1 Completeness

A Spec Graph G is **complete** with respect to implementing agent A and equivalence relation ≡ if:

```
∀ M₁, M₂ ∈ Manifest(G, A):  M₁ ≡ M₂
```

The equivalence relation ≡ is **parameterized by the node types present in the graph:**

| Nodes Present | Equivalence Includes |
|---|---|
| behavior only | Same observable behavior (v1 level) |
| + technical | Same architectural structure |
| + design | Same visual presentation |
| + stack | Same technology foundation |
| + domain | Same data model and business rules |
| + constraint | Same non-functional characteristics |

**A graph with all six node types approaches total equivalence** — two manifestations would be indistinguishable in every dimension the designer specified.

### 6.2 Minimality

G is **minimal** if no node can be removed without breaking completeness:

```
∀ n ∈ nodes(G):
  ∃ M₁, M₂ ∈ Manifest(G \ {n}, A):  M₁ ≢ M₂
```

Every node must be "load-bearing" — its removal would allow the agent to make a choice the designer wouldn't want.

### 6.3 Deterministic Manifestation

The composition of completeness and a capable agent yields **deterministic manifestation**:

```
Complete(G) ∧ Capable(A) → Deterministic(Manifest(G, A))
```

Where `Capable(A)` means the agent can:
1. Parse and traverse the spec graph
2. Resolve dependencies (topological ordering)
3. Apply technical guidance during implementation
4. Respect constraints during all phases
5. Verify each node's verification criteria

### 6.4 The Completeness Gap

In practice, no spec graph is perfectly complete — there will always be some ambient knowledge the agent brings (language semantics, framework conventions, common sense). The goal is to **minimize the completeness gap**:

```
Completeness Gap = {decisions the agent must make} - {decisions the spec determines}
```

A behavior-only spec has a large completeness gap. Each additional node type shrinks it. The practical question is always: **is the remaining gap small enough that the agent's choices won't violate the designer's intent?**

---

## 7. The Manifestation Process

### Layer Ordering

The Spec Graph has a natural manifestation order based on node type dependencies:

```
Layer 0: domain      → Establish shared vocabulary and business rules
Layer 1: stack       → Choose and configure technologies
Layer 2: constraint  → Set non-functional boundaries
Layer 3: design      → Define visual language
Layer 4: technical   → Establish architectural patterns
Layer 5: behavior    → Implement observable functionality
```

Each layer can reference nodes in lower-numbered layers. This ensures that when a behavior is being implemented, the domain model, technology stack, constraints, design system, and architectural patterns are already established.

### Agent Traversal

An implementing agent processes the Spec Graph in three phases:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MANIFESTATION PHASES                               │
│                                                                      │
│  PHASE 1: ORIENT                                                     │
│     Read all domain, stack, and constraint nodes                     │
│     Build understanding of the system's foundation                   │
│     This is "read-only" — no code is written yet                     │
│                                                                      │
│  PHASE 2: SCAFFOLD                                                   │
│     Process design and technical nodes                               │
│     Create architectural scaffolding, design token files,            │
│     abstract interfaces, shared infrastructure                       │
│     Order: dependency-first (topological sort on depends-on edges)   │
│                                                                      │
│  PHASE 3: IMPLEMENT                                                  │
│     Process behavior nodes                                           │
│     For each behavior:                                               │
│       1. Resolve all edges (what guides, constrains, uses this?)     │
│       2. Plan implementation with full context                       │
│       3. Build, following technical guidance                         │
│       4. Verify against behavior's verification criteria             │
│       5. Verify against constraint nodes                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Context Assembly

When manifesting a single behavior node, the agent assembles its full context from the graph:

```
Behavior: AUTH-01 "Login Form Display"
  │
  ├─ guided-by: TECH-AUTH-01 "Abstract Auth Provider Interface"
  │     → "All auth goes through AuthProvider interface..."
  │
  ├─ uses: DESIGN-FORM-01 "Form Component Pattern"
  │     → "Forms use 4px spacing, label-above pattern..."
  │
  ├─ uses: DESIGN-COLOR-01 "Primary Color Palette"
  │     → "Primary: oklch(59.59% 0.24 275.75)..."
  │
  ├─ implements: DOMAIN-USER-01 "User Account"
  │     → "email (unique), displayName, role per project..."
  │
  └─ constrained-by: CONSTRAINT-PERF-01 "API Response Time"
       → "Must respond within 500ms at p95..."
```

The agent doesn't need to search through external documents, agent instructions, or tech stack profiles. **Everything it needs is reachable from the behavior node via edges.**

---

## 8. Practical Authoring

### When to Add Non-Behavioral Nodes

Not every system needs all six node types. Start with behaviors and add other types when the minimality test demands it:

| Scenario | Add This Node Type |
|---|---|
| Two implementations could use incompatible architectures | `technical` |
| Visual inconsistency between features is unacceptable | `design` |
| Technology choice affects how behaviors are implemented | `stack` |
| Business terms are ambiguous without explicit definition | `domain` |
| Performance/security/accessibility must be verified | `constraint` |

### The Spec Graph Growth Pattern

A typical project's spec graph grows in this order:

```
1. Early stage:     behavior nodes only (v1 compatible)
2. Tech decisions:  + stack nodes (lock in framework choices)
3. Architecture:    + technical nodes (establish patterns)
4. Design system:   + design nodes (visual consistency)
5. Domain model:    + domain nodes (shared vocabulary)
6. Quality gates:   + constraint nodes (non-functional requirements)
```

You don't need to start with a complete graph. **Begin with behavior nodes and add nodes as you discover ambiguity in manifestation.**

### ID Conventions

Node IDs follow a type-aware pattern:

| Node Type | ID Pattern | Examples |
|---|---|---|
| `behavior` | `FEATURE-##` | `AUTH-01`, `DASHBOARD-05` |
| `technical` | `TECH-FEATURE-##` | `TECH-AUTH-01`, `TECH-ROUTING-03` |
| `design` | `DESIGN-CATEGORY-##` | `DESIGN-COLOR-01`, `DESIGN-FORM-03` |
| `stack` | `STACK-CATEGORY-##` | `STACK-FRAMEWORK-01`, `STACK-DB-01` |
| `domain` | `DOMAIN-CONCEPT-##` | `DOMAIN-USER-01`, `DOMAIN-PROJECT-02` |
| `constraint` | `CONSTRAINT-CATEGORY-##` | `CONSTRAINT-PERF-01`, `CONSTRAINT-SEC-03` |

### Atomicity Rules by Type

The ONE rule extends to all node types:

| Node Type | Atomic Unit |
|---|---|
| `behavior` | ONE trigger → ONE behavior → ONE outcome |
| `technical` | ONE pattern, ONE architectural decision |
| `design` | ONE visual element or ONE design rule |
| `stack` | ONE technology choice |
| `domain` | ONE business concept |
| `constraint` | ONE measurable requirement |

---

## 9. Split Architecture: Flat Nodes + RDF Graph

The Spec Graph separates **content** (what each node specifies) from **structure** (how nodes relate). This separation is fundamental — the two concerns have different authoring patterns, different validation needs, and different tooling.

### Two Files, Two Concerns

```
┌─────────────────────────────────────┐    ┌─────────────────────────────────┐
│         SPEC.json (Flat Nodes)       │    │    SPEC.graph.jsonld (Edges)     │
│                                      │    │                                  │
│  Content-focused                     │    │  Structure-focused               │
│  Human-authored and edited           │    │  Authored, computed, or derived  │
│  Validated by spec-graph.schema.json │    │  Validated by RDF tooling        │
│  Each node is self-contained         │    │  Each entry is a relationship    │
│                                      │    │                                  │
│  "What does each spec say?"          │    │  "How do specs relate?"          │
└─────────────────────────────────────┘    └─────────────────────────────────┘
```

### Why Split?

| Reason | Explanation |
|---|---|
| **Different edit cadence** | Nodes change when features change. Edges are often discovered during implementation or computed by tooling. |
| **Independent validation** | You can validate all node content without checking structural integrity, and vice versa. |
| **Simpler authoring** | SPEC.json stays readable and editable — no embedded graph syntax. |
| **RDF ecosystem** | Edges in JSON-LD/Turtle unlock graph query (SPARQL), visualization (Graphviz, d3-force), inference engines, and standard validation. |
| **Progressive adoption** | Start with SPEC.json only (behavior nodes, no edges). Add SPEC.graph.jsonld when relationships matter. |

### File 1: SPEC.json — Flat Node Definitions

Validated by `spec-graph.schema.json`. Contains all nodes with their content fields but **no edges**.

```json
{
  "$schema": "./spec-graph.schema.json",
  "version": "2.0.0",

  "features": [
    {
      "id": "AUTH",
      "name": "User Authentication",
      "description": "Login, session management, and logout flows"
    },
    {
      "id": "DESIGNSYSTEM",
      "name": "Design System",
      "description": "Visual language, tokens, and component patterns"
    },
    {
      "id": "INFRASTRUCTURE",
      "name": "Infrastructure",
      "description": "Cross-cutting technology and operational concerns"
    }
  ],

  "nodes": [
    {
      "type": "domain",
      "id": "DOMAIN-USER-01",
      "feature": "AUTH",
      "name": "User Account",
      "definition": "A registered entity that can authenticate and own resources",
      "properties": ["email: string (unique)", "role: enum(owner, admin, member)"],
      "rules": ["Every user has exactly one role per project"],
      "invariant": "Email must be verified before resource access",
      "verification": "Schema enforces email uniqueness; middleware checks verification"
    },
    {
      "type": "stack",
      "id": "STACK-AUTH-01",
      "feature": "AUTH",
      "name": "Clerk Authentication",
      "choice": "Clerk for OAuth and session management",
      "constraints": ["Use Clerk's middleware for route protection", "Store only Clerk subject ID, not credentials"],
      "rationale": "Managed auth reduces security surface area",
      "verification": "package.json contains @clerk/nextjs; no custom auth middleware"
    },
    {
      "type": "technical",
      "id": "TECH-AUTH-01",
      "feature": "AUTH",
      "name": "Auth Provider Abstraction",
      "guidance": "Wrap Clerk behind an AuthProvider interface with authenticate(), validateSession(), revokeSession(). Include a DeterministicProvider for testing.",
      "rationale": "Enables testing without external services and future provider swaps",
      "invariant": "No auth call may bypass the AuthProvider interface",
      "verification": "npx tsc --noEmit (interface exists and all auth calls use it)"
    },
    {
      "type": "design",
      "id": "DESIGN-FORM-01",
      "feature": "DESIGNSYSTEM",
      "name": "Form Input Pattern",
      "specification": "Label above input, 8px gap. Error text below input in destructive color. Focus ring: 2px primary with 2px offset.",
      "invariant": "All form fields must follow the label-above pattern",
      "verification": "Visual inspection of all forms matches pattern"
    },
    {
      "type": "behavior",
      "id": "AUTH-01",
      "feature": "AUTH",
      "name": "Login Form Display",
      "expectation": "Login page renders email and password input fields with a submit button",
      "invariant": "Password field must mask input characters",
      "verification": "npm test -- --grep AUTH-01"
    },
    {
      "type": "constraint",
      "id": "CONSTRAINT-PERF-01",
      "feature": "INFRASTRUCTURE",
      "name": "Page Load Budget",
      "requirement": "All pages must reach First Contentful Paint within 1.5s on 4G connection",
      "severity": "hard",
      "rationale": "Core Web Vitals compliance for SEO and UX",
      "invariant": "FCP ≤ 1.5s on simulated 4G",
      "verification": "Lighthouse CI: lighthouse --preset=perf --assert-fcp=1500"
    }
  ]
}
```

Note: no `edges` fields anywhere. The nodes are pure content.

### File 2: SPEC.graph.jsonld — Graph Relations

A [JSON-LD](https://json-ld.org/) document that encodes all relationships between nodes. JSON-LD is valid JSON (toolable by any JS/TS code) **and** valid RDF (processable by graph tools like SPARQL, Graphviz, N3.js).

The context is defined in `spec-graph.context.jsonld` and maps edge type names to their RDF URIs.

```json
{
  "@context": "./spec-graph.context.jsonld",

  "@graph": [
    {
      "id": "AUTH-01",
      "label": "Login Form Display",
      "guided-by":      ["TECH-AUTH-01"],
      "uses":            ["DESIGN-FORM-01", "DESIGN-COLOR-01"],
      "implements":      ["DOMAIN-USER-01"],
      "constrained-by":  ["CONSTRAINT-PERF-01"]
    },
    {
      "id": "TECH-AUTH-01",
      "label": "Auth Provider Abstraction",
      "requires": ["STACK-AUTH-01"]
    },
    {
      "id": "DESIGN-FORM-01",
      "label": "Form Input Pattern",
      "depends-on": ["DESIGN-COLOR-01"]
    }
  ]
}
```

**Only nodes with edges need to appear in the graph file.** Isolated nodes (no incoming or outgoing edges) exist only in SPEC.json.

### Equivalent Turtle (RDF) Serialization

The same graph in Turtle format — more compact and readable for graph-heavy specs:

```turtle
@prefix sg: <https://dloop.dev/spec-graph/> .
@base  <https://dloop.dev/spec-graph/nodes/> .

<AUTH-01>  sg:guidedBy      <TECH-AUTH-01> ;
           sg:uses           <DESIGN-FORM-01>, <DESIGN-COLOR-01> ;
           sg:implements     <DOMAIN-USER-01> ;
           sg:constrainedBy  <CONSTRAINT-PERF-01> .

<TECH-AUTH-01>  sg:requires  <STACK-AUTH-01> .

<DESIGN-FORM-01>  sg:dependsOn  <DESIGN-COLOR-01> .
```

Turtle can be generated from JSON-LD by any RDF serializer (e.g., `jsonld` npm package → N-Quads → Turtle).

### Inverse Edges Are Computed

The graph file stores **forward edges only**. Inverse edges (e.g., `guides` from `guided-by`) are derived by tooling:

```
SPEC.graph.jsonld declares:       Tooling computes inverse:
  AUTH-01 guided-by TECH-AUTH-01     TECH-AUTH-01 guides AUTH-01
  AUTH-01 uses DESIGN-FORM-01        DESIGN-FORM-01 used-by AUTH-01
```

This keeps the graph DRY — each relationship is declared once, on the node where it's most natural to author.

### Validation Strategy

| File | Validated By | What's Checked |
|---|---|---|
| `SPEC.json` | `spec-graph.schema.json` (JSON Schema) | Node content: required fields, field types, ID patterns, feature references |
| `SPEC.graph.jsonld` | Graph validator (tooling) | Referential integrity (all edge targets exist in SPEC.json), type compatibility, acyclicity of `depends-on`, no self-references |

The two validations are independent. You can have a valid SPEC.json with no graph file (v1 compatibility), or add a graph file later.

### Context File: spec-graph.context.jsonld

The JSON-LD context maps short edge names to RDF URIs:

```json
{
  "@context": {
    "@version": 1.1,
    "@base": "https://dloop.dev/spec-graph/nodes/",
    "sg": "https://dloop.dev/spec-graph/",

    "id":    "@id",
    "label": "rdfs:label",

    "guides":          { "@id": "sg:guides",         "@type": "@id", "@container": "@set" },
    "guided-by":       { "@id": "sg:guidedBy",       "@type": "@id", "@container": "@set" },
    "constrains":      { "@id": "sg:constrains",     "@type": "@id", "@container": "@set" },
    "constrained-by":  { "@id": "sg:constrainedBy",  "@type": "@id", "@container": "@set" },
    "depends-on":      { "@id": "sg:dependsOn",      "@type": "@id", "@container": "@set" },
    "required-by":     { "@id": "sg:requiredBy",     "@type": "@id", "@container": "@set" },
    "implements":      { "@id": "sg:implements",      "@type": "@id", "@container": "@set" },
    "implemented-by":  { "@id": "sg:implementedBy",  "@type": "@id", "@container": "@set" },
    "uses":            { "@id": "sg:uses",            "@type": "@id", "@container": "@set" },
    "used-by":         { "@id": "sg:usedBy",          "@type": "@id", "@container": "@set" },
    "requires":        { "@id": "sg:requires",        "@type": "@id", "@container": "@set" },
    "refines":         { "@id": "sg:refines",         "@type": "@id", "@container": "@set" },
    "related-to":      { "@id": "sg:relatedTo",       "@type": "@id", "@container": "@set" }
  }
}
```

### Graph Queries (SPARQL)

Because SPEC.graph.jsonld is valid RDF, you can query it with SPARQL:

```sparql
# Find all technical guidance that applies to AUTH-01
SELECT ?techNode ?label WHERE {
  <AUTH-01> sg:guidedBy ?techNode .
  ?techNode rdfs:label ?label .
}

# Find all nodes that have no edges (isolated — might need connecting)
SELECT ?node WHERE {
  ?node a ?type .
  FILTER NOT EXISTS { ?node ?p ?o . FILTER(?p != rdf:type && ?p != rdfs:label) }
  FILTER NOT EXISTS { ?s ?p2 ?node . FILTER(?p2 != rdf:type) }
}

# Find transitive dependencies of TASKBOARD-03
SELECT ?dep WHERE {
  <TASKBOARD-03> sg:dependsOn+ ?dep .
}
```

### Graph Visualization

The JSON-LD graph can be rendered visually using standard tools:

```bash
# Convert to DOT format for Graphviz
node scripts/spec-graph-to-dot.js SPEC.graph.jsonld | dot -Tsvg -o spec-graph.svg

# Interactive visualization with d3-force
node scripts/spec-graph-viz.js  # opens browser with force-directed graph
```

### Tooling Pipeline

```
 SPEC.json          SPEC.graph.jsonld
 (flat nodes)       (edges as JSON-LD)
      │                     │
      ▼                     ▼
 JSON Schema            Graph validator
 validation             (ref integrity,
      │                  acyclicity)
      │                     │
      └──────────┬──────────┘
                 │
                 ▼
         Merged Spec Graph
         (in-memory, for agents)
                 │
          ┌──────┼──────────────┐
          ▼      ▼              ▼
      Context  Dependency   Visualization
      Assembly Order        (SVG/HTML)
      (per node)(topo sort)
```

At manifestation time, tooling merges the two files into an in-memory graph that agents traverse. The split is a **storage concern** — at runtime, it's one unified graph.

---

## 10. Format & Schema

### Schema Files

| File | Purpose |
|---|---|
| `spec-graph.schema.json` | JSON Schema validating SPEC.json v2 (flat nodes, no edges) |
| `spec-graph.context.jsonld` | JSON-LD context mapping edge names to RDF URIs |

### Backwards Compatibility with v1

A SPEC.json v1 document can coexist with the v2 format:
- If `version` is `1.x.x` → treat as flat behavior list (existing behavior, nested under features)
- If `version` is `2.x.x` → treat as spec graph (flat nodes with feature references)
- SPEC.graph.jsonld is optional — a v2 SPEC.json with no graph file is a valid spec (just with no edges)

A SPEC.json v1 document is a valid Spec Graph where:
- All nodes are of type `behavior`
- There is no SPEC.graph.jsonld file
- Features contain only behaviors

The migration path is additive — you add node types and the graph file without changing existing behaviors.

---

## 11. Migration from SPEC.json v1

### What Changes

| Aspect | v1 (SPEC.json) | v2 (Spec Graph) |
|---|---|---|
| Node types | `behavior` only | 6 types |
| Structure | Flat array per feature | Graph with typed edges |
| Relationships | Implicit (via feature grouping) | Explicit (typed edges) |
| Tech guidance | External (agent instructions, profiles) | Inline (`technical` nodes) |
| Design system | External (docs, CSS) | Inline (`design` nodes) |
| Domain model | Implicit (in code) | Explicit (`domain` nodes) |
| Constraints | External (agent instructions) | Inline (`constraint` nodes) |
| Completeness | Behavioral only | Multi-dimensional |

### Migration Steps

**Step 1: Structural migration** (no content changes)

Move from nested feature → behaviors structure to flat nodes list with feature references:

```json
// v1: Nested
{ "features": [{ "id": "AUTH", "behaviors": [{ "id": "AUTH-01", ... }] }] }

// v2: Flat with feature reference
{ "features": [{ "id": "AUTH", ... }], "nodes": [{ "type": "behavior", "feature": "AUTH", "id": "AUTH-01", ... }] }
```

**Step 2: Extract tech stack into stack nodes**

What's currently in tech stack profiles becomes `stack` nodes:

```
techStackProfiles["nextjs-convex-v1"].implementor.systemPromptOverride
  → STACK-FRAMEWORK-01, STACK-DB-01, STACK-AUTH-01, ...
```

**Step 3: Extract architectural guidance into technical nodes**

What's currently in agent instructions and tech stack overrides becomes `technical` nodes:

```
"Use App Router not Pages Router"  →  TECH-ROUTING-01
"Wrap auth behind abstract provider"  →  TECH-AUTH-01
```

**Step 4: Create SPEC.graph.jsonld**

Add a graph file connecting behaviors to the technical, design, stack, and domain nodes that inform them.

**Step 5: Add domain and constraint nodes as needed**

Based on the minimality test — add them when manifestation ambiguity requires it.

### Coexistence

During migration, the system can support both v1 and v2 formats:
- If `version` is `1.x.x` → treat as flat behavior list (existing behavior)
- If `version` is `2.x.x` → treat as spec graph (new behavior)

---

## 12. Extended Example

### Scenario: Task Management Feature

A designer wants to add a Kanban-style task board. Here's how the Spec Graph captures everything needed for deterministic manifestation:

```json
{
  "$schema": "./spec-graph.schema.json",
  "version": "2.0.0",
  "features": [
    {
      "id": "TASKBOARD",
      "name": "Task Board",
      "description": "Kanban-style board for managing project tasks"
    }
  ],
  "nodes": [

    // ─── DOMAIN: What concepts exist? ───

    {
      "type": "domain",
      "id": "DOMAIN-TASK-01",
      "feature": "TASKBOARD",
      "name": "Task",
      "definition": "A unit of work with a title, description, assignee, and status that moves through a Kanban workflow",
      "properties": [
        "title: string (required, 1-200 chars)",
        "description: string (optional, markdown supported)",
        "status: enum(backlog, in-progress, review, done)",
        "assignee: reference to User (optional)",
        "priority: enum(low, medium, high, critical)",
        "createdAt: timestamp (immutable)",
        "updatedAt: timestamp (auto-updated on any change)"
      ],
      "rules": [
        "Tasks are created in 'backlog' status by default",
        "Status transitions follow: backlog → in-progress → review → done",
        "Only the assignee or a project admin can change task status"
      ],
      "invariant": "A task's createdAt timestamp must never change after creation",
      "verification": "Schema validation + mutation guards enforce status transitions"
    },

    // ─── STACK: What's it built with? ───

    {
      "type": "stack",
      "id": "STACK-DRAGDROP-01",
      "feature": "TASKBOARD",
      "name": "DnD Library",
      "choice": "@dnd-kit/core for drag and drop interactions",
      "constraints": [
        "Use SortableContext for within-column reordering",
        "Use DndContext with multiple DroppableContainers for cross-column moves",
        "Keyboard accessibility must work (DnD Kit supports this natively)"
      ],
      "rationale": "DnD Kit is the most accessible React DnD library with the smallest bundle size",
      "verification": "package.json contains @dnd-kit/core; drag operations work via keyboard"
    },

    // ─── TECHNICAL: How should it be built? ───

    {
      "type": "technical",
      "id": "TECH-TASKBOARD-01",
      "feature": "TASKBOARD",
      "name": "Optimistic Status Updates",
      "guidance": "Task status changes must use optimistic updates. On drag-end, immediately update local state to reflect the new column position. Send the mutation to Convex in the background. If the mutation fails, revert to the previous position and show an error toast.",
      "rationale": "Kanban boards feel sluggish without optimistic updates. Users expect instant visual feedback when dragging cards.",
      "invariant": "Failed mutations must revert the optimistic update within 3 seconds",
      "verification": "Simulate network failure during drag; card reverts to original column"
    },
    {
      "type": "technical",
      "id": "TECH-TASKBOARD-02",
      "feature": "TASKBOARD",
      "name": "Real-Time Sync via Convex Subscriptions",
      "guidance": "The board state must be powered by a Convex useQuery subscription, not periodic polling. When another user moves a task, the board must update in real-time without a page refresh. Use Convex's reactive queries to subscribe to the tasks table filtered by project.",
      "rationale": "Multi-user collaboration requires real-time state. Convex subscriptions provide this without WebSocket management.",
      "invariant": "Board state must reflect backend state within 1 second of any change",
      "verification": "Open two browser tabs; move a task in one; verify it appears in the other within 1s"
    },

    // ─── DESIGN: How should it look? ───

    {
      "type": "design",
      "id": "DESIGN-TASKCARD-01",
      "feature": "TASKBOARD",
      "name": "Task Card",
      "specification": "Card: white bg, 1px border-muted, 8px radius, 12px padding. Title: 14px semibold. Priority badge: top-right, colored dot (critical=red, high=orange, medium=blue, low=gray). Assignee: 24px avatar circle, bottom-right. Drag shadow: 4px blur, 8px offset, 0.15 opacity.",
      "invariant": "All task cards must show title and priority; assignee shown only when assigned",
      "verification": "Visual inspection: cards match spec in all four columns"
    },

    // ─── CONSTRAINT: What limits apply? ───

    {
      "type": "constraint",
      "id": "CONSTRAINT-TASKBOARD-01",
      "feature": "TASKBOARD",
      "name": "Board Render Performance",
      "requirement": "Board must render 200 tasks across 4 columns without dropping below 60fps during scroll",
      "severity": "hard",
      "rationale": "Active projects can have 100+ tasks; janky scrolling is unacceptable",
      "invariant": "60fps maintained with 200 task cards visible",
      "verification": "Chrome DevTools Performance tab: render 200 cards, verify no frames > 16ms"
    },

    // ─── BEHAVIOR: What does the user see and do? ───

    {
      "type": "behavior",
      "id": "TASKBOARD-01",
      "feature": "TASKBOARD",
      "name": "Board Column Display",
      "expectation": "Task board displays four columns: Backlog, In Progress, Review, and Done",
      "invariant": "Column order is fixed and not user-configurable",
      "verification": "npm test -- --grep TASKBOARD-01"
    },
    {
      "type": "behavior",
      "id": "TASKBOARD-02",
      "feature": "TASKBOARD",
      "name": "Task Card in Column",
      "expectation": "Each task appears as a card in the column matching its current status",
      "invariant": "A task card must appear in exactly one column",
      "verification": "npm test -- --grep TASKBOARD-02"
    },
    {
      "type": "behavior",
      "id": "TASKBOARD-03",
      "feature": "TASKBOARD",
      "name": "Drag Task Between Columns",
      "expectation": "Users can drag a task card from one column to another to change its status",
      "invariant": "Status transitions must follow the allowed sequence",
      "verification": "npm test -- --grep TASKBOARD-03"
    }
  ]
}
```

**Companion graph file** (`SPEC.graph.jsonld`):

```json
{
  "@context": "./spec-graph.context.jsonld",
  "@graph": [
    {
      "id": "TASKBOARD-01",
      "guided-by":      ["TECH-TASKBOARD-02"],
      "implements":      ["DOMAIN-TASK-01"],
      "constrained-by":  ["CONSTRAINT-TASKBOARD-01"]
    },
    {
      "id": "TASKBOARD-02",
      "guided-by":      ["TECH-TASKBOARD-02"],
      "uses":            ["DESIGN-TASKCARD-01"],
      "implements":      ["DOMAIN-TASK-01"],
      "constrained-by":  ["CONSTRAINT-TASKBOARD-01"]
    },
    {
      "id": "TASKBOARD-03",
      "guided-by":      ["TECH-TASKBOARD-01", "TECH-TASKBOARD-02"],
      "uses":            ["DESIGN-TASKCARD-01"],
      "implements":      ["DOMAIN-TASK-01"],
      "constrained-by":  ["CONSTRAINT-TASKBOARD-01"]
    },
    {
      "id": "TECH-TASKBOARD-01",
      "requires": ["STACK-DRAGDROP-01"]
    },
    {
      "id": "DESIGN-TASKCARD-01",
      "depends-on": ["DESIGN-COLOR-01"]
    }
  ]
}
```

### What This Achieves

An implementing agent given this spec graph knows:

1. **What "task" means** — its properties, rules, status transitions (domain)
2. **What library to use for drag & drop** — and how to use it accessibly (stack)
3. **How to handle optimistic updates** — and what to do on failure (technical)
4. **How to keep state in sync** — real-time via Convex subscriptions (technical)
5. **What cards look like** — exact colors, sizes, layout (design)
6. **What performance is acceptable** — 60fps with 200 cards (constraint)
7. **What the user can do** — view columns, see cards, drag between columns (behavior)

Two different implementing agents, given this graph, would produce systems that are functionally, architecturally, visually, and performantly equivalent. **The completeness gap is small** — the remaining agent decisions (variable names, exact file structure, test organization) don't affect the designer's intent.

Without the non-behavioral nodes, two agents might:
- One uses react-beautiful-dnd (deprecated), the other uses @dnd-kit
- One polls for updates, the other uses subscriptions
- One builds cards with 20px padding, the other uses 4px
- One skips optimistic updates entirely (laggy UX)
- One allows arbitrary status transitions (domain violation)

The Spec Graph eliminates these divergences by making the designer's intent explicit across all dimensions.

---

## Appendix A: Glossary

| Term | Definition |
|---|---|
| **Spec Graph** | The complete, multi-dimensional specification of a system |
| **Node** | A single specification entry with a type, ID, and content |
| **Edge** | A typed relationship between two nodes |
| **Feature** | A namespace grouping related nodes across types |
| **Manifestation** | The process of producing a running system from a spec |
| **Completeness** | Property that manifestation is deterministic across all specified dimensions |
| **Minimality** | Property that no node can be removed without breaking completeness |
| **Completeness Gap** | The set of decisions left to the implementing agent |
| **Load-bearing** | A node whose removal would create manifestation ambiguity |

## Appendix B: Comparison with Adjacent Concepts

| Concept | Similarity | Difference |
|---|---|---|
| **PRD** | Both describe what to build | PRDs are prose; Spec Graph is structured, machine-actionable |
| **Architecture Decision Records** | Both capture technical decisions | ADRs are historical narrative; technical nodes are prescriptive |
| **Design tokens** | Both specify visual properties | Design tokens are values; design nodes include usage rules and relationships |
| **Domain-Driven Design** | Both model business concepts | DDD is a methodology; domain nodes are declarative specifications |
| **Infrastructure as Code** | Both aim for deterministic creation | IaC specifies infrastructure; Spec Graph specifies the entire system intent |
| **UML** | Both model system structure | UML diagrams are descriptive; Spec Graph nodes are prescriptive with verification |

## Appendix C: Node Type Quick Reference

```
┌──────────────┬─────────────────────┬──────────────────────────────┐
│ Type         │ Key Field           │ Answers                      │
├──────────────┼─────────────────────┼──────────────────────────────┤
│ behavior     │ expectation         │ What does the user see/do?   │
│ technical    │ guidance            │ How should it be built?      │
│ design       │ specification       │ How should it look/feel?     │
│ stack        │ choice + constraints│ What technology, what rules? │
│ domain       │ definition + rules  │ What concepts exist?         │
│ constraint   │ requirement         │ What limits must be met?     │
└──────────────┴─────────────────────┴──────────────────────────────┘
```
