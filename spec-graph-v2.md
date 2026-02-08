# Complete Spec Graph (CSG) v0.1

A proposal for a total spec format that can deterministically manifest a system by encoding not only behavior, but also the full design, technical, and operational intent needed for predictable implementation.

This document complements the current behavioral spec rules in `spec.schema.json` and `docs/spec-rules.md`. It does not replace them. It defines a multi-dimensional spec graph that can include behavioral specs plus the technical guidance, design system, and execution context required to manifest the intended system.

---

**Problem**

Behavior-only specs are insufficient to deterministically manifest complex systems. Critical information like design system, tech stack, architectural constraints, and domain guidance often exists in scattered docs or in a senior engineer's head. That breaks predictability and repeatability.

---

**Goals**

- Provide a single, complete, and minimal spec graph that is sufficient to reproduce the system.
- Preserve the atomicity and testability of behavioral specs.
- Make technical guidance first-class, not implicit.
- Enable consistent manifestation by both humans and agents.
- Support deterministic testing of complex workflows.

---

**Non-Goals**

- Replace existing SPEC.json immediately.
- Encode full implementation details or source code in the spec.
- Eliminate human judgment during manifestation. The goal is to constrain and guide it.

---

**Definitions**

- Complete Spec: A spec that includes all information required to manifest the intended system to a logically equivalent result.
- Spec Graph: A typed, connected graph of spec nodes and relationships, spanning behavior, design, tech stack, and operational constraints.
- Manifestation: The end-to-end process of planning, designing, coding, building, and deploying a system from the spec graph.
- Deterministic Provider: A testing provider that returns predictable outputs for agentic workflows.

---

**Core Principles**

- The graph is the constitution. Anything needed to build or verify the system must be in the graph or referenced by it.
- Behavioral specs remain atomic and user-centric. Technical guidance is a separate dimension.
- Every node must be testable or verifiable by explicit criteria.
- The graph should be minimal. Redundant or derived information should live in generated artifacts, not the graph.

---

**Spec Graph Overview**

The graph is a set of typed nodes and typed edges. Nodes carry declarative intent. Edges express dependency, constraint, or verification relationships.

The graph is multi-dimensional, but it is one structure. It can be stored in a single file or split across files as long as the canonical graph can be reassembled deterministically.

---

**Node Types**

Each node type has an ID, a short name, a description, and verification criteria. Additional fields are type-specific.

Minimum set of node types:

- BehaviorSpec
- DesignSystemSpec
- TechStackSpec
- ArchitectureGuidanceSpec
- DomainModelSpec
- DataSchemaSpec
- NonFunctionalSpec
- OpsSpec
- AgentRuntimeSpec
- VerificationSpec

Optional node types for richer modeling:

- SecuritySpec
- ComplianceSpec
- CostSpec
- UXCopySpec
- IntegrationSpec
- MigrationSpec

---

**Edge Types**

- depends_on: Node A requires Node B to be meaningful or implementable.
- constrains: Node A limits the acceptable solutions for Node B.
- implements: Node A provides implementation guidance for Node B.
- verifies: Node A validates Node B.
- derives: Node A is generated from Node B and should not be authored manually.
- supersedes: Node A replaces Node B.

---

**Dimension Details**

BehaviorSpec
- Current SPEC.json entries remain the source of behavioral intent.
- Atomicity rules from `docs/spec-rules.md` apply unchanged.
- BehaviorSpec nodes must connect to at least one VerificationSpec.

DesignSystemSpec
- Captures tokens, typography, spacing, component primitives, and visual rules.
- May reference `design-system/` artifacts as canonical sources.
- Constrains BehaviorSpec nodes that produce UI.

TechStackSpec
- Specifies required frameworks, runtime constraints, build tools, and versions.
- Constrains implementation choices and CI behavior.
- Includes explicit cost or performance constraints when relevant.

ArchitectureGuidanceSpec
- Encodes structural patterns or architectural constraints that are not purely behavioral.
- Examples: adapter interfaces, provider abstractions, layering rules, state machine patterns.

DomainModelSpec
- Defines domain entities, invariants, and relationships.
- Constrains BehaviorSpec and DataSchemaSpec nodes.

DataSchemaSpec
- Describes database schema or data contracts in a declarative format.
- Constrains BehaviorSpec nodes that read or write data.

NonFunctionalSpec
- Performance, reliability, latency, privacy, accessibility, and quality targets.
- Constrains implementation and verification.

OpsSpec
- Deployment, environments, monitoring, and rollback requirements.
- Constrains tooling and release processes.

AgentRuntimeSpec
- Defines the intended execution environment for agents, including tooling, permissions, and deterministic provider availability.
- Describes the minimal agent capabilities assumed by the graph.

VerificationSpec
- Captures commands, tests, and evaluation harnesses required to validate other nodes.
- Provides reproducible pass or fail criteria.

---

**Determinism and Completeness**

A graph is considered complete if these conditions are true:

- All BehaviorSpec nodes are reachable from at least one VerificationSpec.
- All non-behavioral constraints are reachable from the behaviors they constrain.
- The AgentRuntimeSpec defines the assumed capabilities and tools used for manifestation.
- TechStackSpec pins any dependency that materially affects behavior.
- DesignSystemSpec fully defines UI primitives used by UI behaviors.

A graph is considered minimal if these conditions are true:

- Removing any single non-derived node makes at least one behavior under-specified or unverifiable.
- Derived nodes are generated and not manually authored.
- Duplicate constraints are consolidated into a single node with multiple edges.

---

**Manifestation Contract**

The graph is executed through a deterministic pipeline. Each stage consumes a slice of the graph and emits artifacts that are themselves traceable to graph nodes.

Proposed stages:

1. Validate the graph schema and invariants.
2. Materialize design and tech context for the planner.
3. Generate or update behavioral specs if needed.
4. Create tasks with explicit node coverage.
5. Implement in constrained increments.
6. Verify using VerificationSpec nodes.
7. Record evidence and traceability.

---

**Graph Storage Proposal**

A new canonical file can coexist with the current SPEC.json.

Suggested files:

- `SPEC.json` for BehaviorSpec nodes.
- `SPEC.graph.json` for the full graph.
- `SPEC.graph.schema.json` for validation rules.

If split, the graph is assembled by loading and merging nodes from the above sources.

---

**Example: Technical Guidance for Agent Providers**

This captures the non-behavioral guidance described in the prompt.

- ArchitectureGuidanceSpec: define a provider interface for agents.
- ArchitectureGuidanceSpec: include a deterministic provider used in tests.
- VerificationSpec: test harness uses the deterministic provider by default.
- TechStackSpec: pin the agent SDK version and provider adapters.

---

**Example Graph Snippet (Illustrative)**

```json
{
  "nodes": [
    {
      "id": "AUTH-01",
      "type": "BehaviorSpec",
      "name": "Login Form Display",
      "expectation": "Login page renders email and password input fields with a submit button",
      "invariant": "Password field must mask input characters",
      "verification": "npx tsc --noEmit && npm test -- --grep AUTH-01"
    },
    {
      "id": "DS-01",
      "type": "DesignSystemSpec",
      "name": "Core UI Tokens",
      "description": "Typography, spacing, color tokens in design-system/",
      "verification": "npm run lint"
    },
    {
      "id": "ARCH-01",
      "type": "ArchitectureGuidanceSpec",
      "name": "Agent Provider Abstraction",
      "description": "All agent providers implement a shared interface. Include deterministic provider for tests.",
      "verification": "npm test -- --grep provider-interface"
    },
    {
      "id": "VR-01",
      "type": "VerificationSpec",
      "name": "Auth UI Verification",
      "description": "Runs UI tests for login behavior",
      "command": "npm test -- --grep AUTH-01"
    }
  ],
  "edges": [
    { "from": "AUTH-01", "to": "DS-01", "type": "constrains" },
    { "from": "ARCH-01", "to": "AUTH-01", "type": "constrains" },
    { "from": "VR-01", "to": "AUTH-01", "type": "verifies" }
  ]
}
```

---

**Migration Strategy**

- Keep SPEC.json as-is for behavior specs.
- Introduce SPEC.graph.json for non-behavior nodes.
- Add graph validation in the planner and spec manager agents.
- Expand the task queue to support graph-derived tasks.

---

**Open Questions**

- What is the minimal schema for each non-behavior node type?
- How strictly should determinism be enforced for models and toolchains?
- What level of pinning is required for external services?
- How should we encode tradeoffs when multiple solutions are acceptable?

---

**Summary**

The Complete Spec Graph extends DLOOP beyond behavioral specs by adding technical, design, and operational intent as first-class, verifiable nodes. It preserves the atomic behavioral spec model while making manifestation predictable and repeatable. This is the foundation for deterministic re-manifestation of a system by teams of agents.
