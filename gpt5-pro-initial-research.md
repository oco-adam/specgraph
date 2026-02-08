SpecGraph v2: Complete Manifestation Specifications
Status: Proposal / DraftAudience: teams using DLOOP-style agent loops who want predictable “spec → system” manifestation, including behavior plus everything else required to build it right.

1. Background
   Today, DLOOP’s spec format is intentionally behavior-only: a SPEC.json groups features and atomic behaviors, where each behavior has an expectation (“WHAT”), an invariant (hard constraint), and verification criteria.The writing rules enforce the ONE rule (ONE trigger, ONE behavior, ONE outcome) and strongly discourage “HOW”/implementation details in behavior expectations.In DLOOP v1, other “non-behavior” work (design-system, tech-stack, schema, etc.) is typically handled as separate task types and separate documents / patterns, while SPEC.json remains the behavior source of truth.
   This is virtuous: behavior specs stay crisp, testable, and reviewable. But it also forces a shadow spec to exist in a mishmash of docs, tribal knowledge, and codebase patterns.

2. Problem Statement
   A behavior-only spec is insufficient if the top-level goal is:
   A declarative, reviewable, versioned specification from which a team of agents can automatically and predictably manifest the designer’s intended system.
   “Manifestation” here includes: planning, designing, coding, configuring infrastructure, applying design systems, enforcing cost/security constraints, and deploying.
   In real projects, success often depends on decisions that are not “behavior”:

- tech stack choices (and versions)
- architectural patterns and boundaries
- design system tokens/components
- operational constraints (cost limits, rate limits, observability)
- domain glossary and rules
- “senior engineer guidance” that narrows the solution space
  If those decisions are not first-class spec artifacts, then manifestation becomes non-deterministic: different implementors (human or agentic) can produce wildly different “correct” systems.

3. Goal: “Complete Specs” as a Minimal Spec Graph
   3.1 Definition: Complete Spec
   A Complete Spec is a graph of typed declarations that, when interpreted by a fixed “manifestor” (team of agents + toolchain), yields the same or logically equivalent system outcome each time.

- Complete: contains enough information to avoid “unknown unknowns” that force implementors to guess.
- Minimal: contains no information that doesn’t materially reduce ambiguity or improve verifiability.
  3.2 Practical Determinism
  We distinguish:
- Byte-level determinism (rarely achievable end-to-end): same repo bytes.
- Semantic determinism (practical target): the system is logically equivalent under a declared equivalence contract (tests, invariants, golden snapshots, SLIs).
  SpecGraph v2 aims for semantic determinism by default, with optional stricter modes where appropriate.

4. Core Idea: A Multi-Dimensional Spec Graph
   Instead of a flat SPEC.json, we introduce SpecGraph: a graph of nodes and edges.

- Nodes are typed spec units: behavior specs, stack decisions, design tokens, architecture decisions, domain rules, etc.
- Edges express relationships: “depends on”, “constrains”, “implements”, “verified by”, “derived from”.
  This allows the spec to be both:
- multi-dimensional (behavior + design + stack + architecture + ops + domain)
- still atomic (each node is small and reviewable)

5. The SpecGraph Data Model
   5.1 Node Types
   A SpecGraph node has a type that determines its semantics and validation rules.
   Recommended initial node types:
   Behavior Layer (what users observe)

- feature (grouping)
- behavior (the current “ONE rule” unit)
  Domain Layer (what the system means)
- domain_term (glossary)
- business_rule (hard domain constraint)
- policy (compliance/legal rules)
  Experience Layer (how it looks/feels, still declarative)
- design_token (colors, typography, spacing)
- ui_component_contract (component props/states/variants)
- ux_rule (accessibility, content rules)
  Technical Layer (how it is constructed, without ad-hoc docs)
- stack (frameworks, runtimes)
- dependency (libraries + version constraints)
- architecture_decision (ADR-like “we will do X”)
- module_boundary (ownership and coupling constraints)
- interface_contract (public interfaces that must exist)
- data_model (schemas, migrations, invariants)
- api_contract (REST/GraphQL/event contracts)
  Operational Layer (what it costs, how it runs)
- infra_resource (queues, DBs, services)
- observability_contract (logs, metrics, tracing)
- security_constraint (threat-model-derived constraints)
- performance_budget (latency/cost ceilings)
  Manifestation Layer (how agents produce the system)
- manifestor_profile (agents, roles, allowed tools/models, policies)
- manifestation_pipeline (deterministic steps + gates)
- equivalence_contract (what counts as “same system”)
  You can start with fewer types and grow the set over time. The key is that each type has rules and verifiers.

  5.2 A Uniform Node Shape
  To keep the system teachable and enforceable, all node types share a common “core” schema:
  {
  "id": "ARCH-01",
  "type": "architecture_decision",
  "title": "Abstract Agent Provider",
  "statement": "The codebase exposes an AgentProvider interface and all agent calls go through it.",
  "constraints": [
  "A DeterministicProvider exists for repeatable tests.",
  "No module may call vendor SDKs directly outside /src/agents/providers."
  ],
  "verification": [
  "npx tsc --noEmit",
  "npm test -- --grep ARCH-01",
  "lint: no-direct-vendor-imports"
  ],
  "status": "approved",
  "links": {
  "depends_on": ["STACK-01"],
  "constrains": ["BEHAV-AGENTS-01", "TEST-02"]
  },
  "metadata": {
  "rationale": "Enables provider swapping and deterministic workflow tests."
  }
  }
  Fields:

- statement: the declarative “truth” that must hold.
- constraints: mandatory invariants (may be empty).
- verification: one or more checks; each must be pass/fail.
- links: graph connectivity.
- status: lifecycle and gating.
  This generalizes the existing expectation/invariant/verification trio into a model that works beyond behaviors while preserving the “spec as executable truth” spirit. (Behavior nodes can still use expectation/invariant/verification as aliases for compatibility.)

  5.3 Edge Semantics
  Edges are typed and mean something.
  Recommended initial edge types:

- contains — grouping (feature → behavior, design system → tokens)
- depends_on — needs this to be true/available first
- constrains — narrows implementation choices for the target node(s)
- derived_from — generated/imported with a pinned hash
- verified_by — points to test or tool checks
- supersedes — replacement and migration
  Rule: edges must never be purely decorative; each must affect planning, implementation, or verification.

6. Atomicity Rules for a Graph World
   Behavior nodes keep the existing ONE rule.But other node types need their own atomicity principle.
   6.1 The “ONE Decision” Rule
   For non-behavior nodes:
   Each node MUST express ONE decision / ONE contract / ONE constraint set, with ONE verification intent.
   If it contains “and” across multiple decisions, split.
   Examples:

- ✅ STACK-01: “Runtime is Node 20 + Next.js 15”
- ❌ STACK-01: “Use Node 20, Next.js, Convex, Clerk, and Tailwind and set up CI” \* Split into stack, auth provider, styling system, CI pipeline nodes.
  6.2 Node Size Guidelines
  Mirroring DLOOP v1’s character-limit heuristics for behaviors , SpecGraph uses type-specific size limits enforced by agents:
- statement: target ≤ 240 chars
- each constraint: target ≤ 140 chars
- each verification entry: target ≤ 180 chars
- optional rationale: longer allowed, but must be clearly non-normative (informational)
  The point of limits is not brevity; it’s atomicity pressure.

7. Normative vs Informative Content
   SpecGraph distinguishes:

- Normative: MUST be true, MUST be implemented, MUST pass verification.
- Informative: context, rationale, examples.
  A simple way to implement this:
- statement, constraints, and verification are always normative.
- metadata.rationale, metadata.notes, metadata.examples are informative.
  This prevents “helpful notes” from becoming implicit requirements.

8. External Artifacts Without Reintroducing Non-Determinism
   Design systems and stack docs often live elsewhere (Figma, internal wikis). If SpecGraph just links to them, you reintroduce ambiguity and drift.
   8.1 Content-Addressed Imports
   Introduce an artifact node type:
   {
   "id": "ART-DS-01",
   "type": "artifact",
   "title": "Design Tokens v3",
   "statement": "The design token set is imported from the referenced artifact hash.",
   "constraints": ["Artifact hash must match the content used in builds."],
   "verification": ["specgraph verify-artifacts"],
   "metadata": {
   "source": "figma://file/abc123?node-id=...",
   "sha256": "…",
   "format": "tokens-studio-json"
   }
   }
   The hash makes the spec stable. Agents/tools can fetch the artifact, but the spec’s truth is tied to the content hash, not the URL.
   8.2 Generated Projections
   Artifacts can be compiled into:

- design_token nodes
- ui_component_contract nodes
- codegen outputs
  But compilation must be deterministic and verified.

9. Manifestation: From SpecGraph → Tasks → System
   DLOOP v1 already separates spec work from implementation work and uses specialized agents plus review gates.SpecGraph v2 keeps that loop, but changes the unit of spec and expands what counts as “spec”.
   9.1 Manifestation Pipeline (Conceptual)
1. Validate: schema + graph integrity checks (IDs, edges, cycles, required coverage)
1. Plan: derive a task graph from the spec graph
1. Implement: code/config/design changes per task
1. Verify: run node-level and system-level verification
1. Release: deploy (if applicable)
1. Record: lock manifestation metadata (tool versions, artifact hashes)
   9.2 Deterministic Task Derivation
   A key property: the mapping from SpecGraph → task queue is deterministic.
   Example derivation rules:

- Each behavior node in approved status yields one spec-implementation task.
- Each stack/dependency/infra_resource node yields a tech-stack task.
- Each design_token/ui_component_contract node yields a design-system task.
- Each data_model node yields a schema task.
  This aligns with the task taxonomy already described in DLOOP v1.
  9.3 Specialized Spec Managers, Still One Source of Truth
  Instead of one “Spec Manager” who only edits behavior specs, you have spec-manager roles per node type:
- Behavior Spec Manager (behavior nodes)
- Stack Spec Manager (stack/dependency nodes)
- Design Spec Manager (design nodes)
- Architecture Spec Manager (architecture_decision/interface_contract nodes)
  But all edits land in the same SpecGraph repository path, so the spec remains the single source of truth.

10. Verification as the Spine of Predictability
    Behavior-only specs already require verification criteria.SpecGraph extends this: every normative node must be verifiable.
    10.1 Types of Verification

- Executable: tests, commands, linters, policy checks
- Static: AST rules, dependency graph constraints
- Golden: snapshots, schema hashes, generated token diffs
- Manual: last resort, but must still be unambiguous and scoped
  10.2 Global Equivalence Contract
  A SpecGraph includes a special node:
  EQ-01 (equivalence_contract):
- declares what “same system” means
- lists the required gates: unit tests, integration tests, contract tests, lint policies, performance budgets, etc.
  This is how the spec formally defines “logically equivalent”.

11. Example: Capturing “Senior Guidance” as Spec Nodes
    Your example about agent providers becomes first-class spec:
    Nodes
    STACK-01 (stack)Statement: “Agent integrations use provider SDKs only within /src/agents/providers/\*.”
    ARCH-01 (architecture_decision)Statement: “The system exposes an AgentProvider interface used by all workflows.”Constraints: “No direct vendor calls outside providers.”Verification: “lint: no-direct-vendor-imports”.
    TEST-02 (test_strategy)Statement: “Workflow/state machine tests use DeterministicProvider by default.”
    BEHAV-AGENTS-01 (behavior)Expectation: “Workflows call the configured agent provider to obtain responses.”Invariant: “None” (or a relevant constraint).Verification: “npm test -- --grep BEHAV-AGENTS-01”.
    Edges

- ARCH-01 depends_on STACK-01
- TEST-02 depends_on ARCH-01
- ARCH-01 constrains BEHAV-AGENTS-01
  This makes guidance explicit, reviewable, and enforceable—without polluting user-facing behavior specs with implementation details.

12. File Layout Recommendation
    To avoid giant, conflict-heavy files, prefer a directory-based graph:
    specgraph/
    graph.json # index, version, node list (or refs)
    nodes/
    BEHAV/
    AUTH-01.json
    AUTH-02.json
    STACK/
    STACK-01.json
    DEP-REACT-01.json
    ARCH/
    ARCH-01.json
    DESIGN/
    TOK-COLOR-PRIMARY.json
    projections/
    SPEC.json # optional compatibility output

- graph.json is the canonical index.
- Nodes are small and atomic.
- Projections are generated (and verified) artifacts.

13. Migration Path from SPEC.json v1
    Because v1 is stable and useful, SpecGraph v2 should be adoptable incrementally:
1. Keep SPEC.json as a projection for behavior-only consumers.
1. Introduce SpecGraph alongside it:
   - import each existing behavior as a behavior node
   - generate SPEC.json from SpecGraph behavior nodes
1. Gradually add non-behavior nodes:
   - stack nodes first (most deterministic impact)
   - then architecture decisions
   - then design tokens/component contracts
1. Add verifiers (lint rules, policy checks) as you add node types.

1. Design Principles Summary
   SpecGraph v2 is guided by:
1. Declarative truth, not narrative docsEvery important decision becomes a verifiable node.
1. Atomicity everywhereONE rule for behaviors, ONE decision rule for other node types.
1. Graph-first, projection-secondHumans and agents work on the graph; legacy formats are projections.
1. Determinism through constraintPredictability comes from explicitly narrowing the solution space.
1. Verification is mandatoryIf it can’t be verified, it’s not a complete spec.
1. Minimal completenessOnly include what reduces ambiguity or increases verifiability.

1. Next Steps (Concrete)
   If you want to turn this into a working v2 quickly, the smallest viable plan is:
1. Define a JSON Schema for the common node shape + a few node types (behavior, stack, architecture_decision, artifact).
1. Write a “specgraph lint” tool:
   - unique IDs
   - allowed edge types
   - acyclic depends_on
   - required fields
1. Add a projection generator:
   - SpecGraph → SPEC.json (behavior-only view)
1. Extend DLOOP task derivation:
   - create tasks from node types, preserving v1 task separation.
1. Pilot on one feature:
   - capture behavior + stack + one architecture decision + verification gates

End of document.
