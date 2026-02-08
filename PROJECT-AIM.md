# Project Aim: Spec Graph Framework

## Context

DLOOP v1 (drafted in the [selfimloop](https://github.com/omnifiedLtd/selfimloop) repository, never published or used in production) explored a declarative, behavior-only specification format (`SPEC.json`) for automated agentic software development. Each behavior spec was atomic (ONE trigger, ONE behavior, ONE outcome) and described *what* the system does from the user's perspective, never *how*. Teams of specialized agents (planner, spec manager, implementor, reviewer) would process these specs through a continuous development loop to manifest working systems.

The core insight — that atomic, declarative specs can drive automated development — remains sound. However, limiting specs to behavior alone is **necessary but not sufficient** for deterministic system manifestation. Critical information remains scattered across agent instructions, tech stack profiles, ad-hoc documents, PR comments, and engineers' heads:

- Architectural patterns and boundaries
- Design system tokens, components, and visual rules
- Technology choices and usage constraints
- Domain model definitions and business rules
- Non-functional requirements (performance, security, accessibility)
- Senior engineer guidance that narrows the solution space

Without this information in the spec, two competent agents given the same behavioral spec can produce systems that behave identically but differ in architecture, visual presentation, technology foundation, and domain semantics. The spec leaves too many decisions unspecified, creating a large **completeness gap** that implementors fill non-deterministically.

## Problem Statement

A behavior-only spec is insufficient when the goal is:

> A declarative, reviewable, versioned specification from which a team of agents can automatically and predictably manifest the designer's intended system.

"Manifestation" encompasses the full process: planning, designing, coding, building, testing, and deploying. Predictability requires that the spec determines all decisions the designer cares about, across every dimension — not just behavior.

## Goal

Design a formal specification framework — the **Spec Graph** — with this defining property:

> The Spec Graph is the minimal structure that, when processed by a capable implementing agent, will always produce logically equivalent manifestations of the designer's intended system.

Formally:

- **Completeness**: For all manifestations M1, M2 produced from graph G by agent A: M1 is logically equivalent to M2 across every dimension specified in G.
- **Minimality**: Every node in the graph is load-bearing. Removing any node would allow the agent to make a choice the designer wouldn't want.

"Logically equivalent" is parameterized by the dimensions the graph covers. A graph with only behavior nodes guarantees behavioral equivalence. Adding technical, design, stack, domain, and constraint nodes progressively narrows the completeness gap toward total equivalence.

## Scope of This Repository

This repository is a **research and design** project. Its purpose is to:

1. **Formalize the theory** of the Spec Graph: completeness, minimality, deterministic manifestation, the completeness gap, and the relationship between spec dimensionality and manifestation equivalence.

2. **Define the data model**: node types (behavior, technical, design, stack, domain, constraint, and potentially others), edge types (guides, constrains, depends-on, implements, uses, etc.), and their schemas.

3. **Design the storage format**: how the graph is serialized (flat nodes in JSON, edges in JSON-LD/RDF or node-local links), and how it is validated.

4. **Specify the manifestation process**: how agents traverse the graph (orient, scaffold, implement), how context is assembled per-node from edges, and how verification works across all node types.

5. **Produce formal outputs**: markdown documents describing the framework and JSON schemas that can be consumed by an agentic development platform to guide fully automated software development.

The repository does **not** implement the framework as running code. It produces the specification that an implementation would follow.

## Relationship to DLOOP v1

DLOOP v1 is prior art and inspiration, not a constraint. The Spec Graph framework is a clean-sheet design that draws on lessons learned from v1 — particularly the value of atomicity, declarative specs, and agent-driven development loops — but is free to diverge wherever doing so produces a better framework. There is no backwards compatibility requirement.

## Key Design Principles

- **Atomicity applies to all node types.** The ONE rule (one trigger, one behavior, one outcome) from DLOOP v1 was a good idea. The Spec Graph generalises it: every node expresses one decision, one contract, or one constraint. But the specific schema, naming, and structure of nodes are not bound to v1's format.
- **Every normative node must be verifiable.** If it cannot be verified, it is not a complete spec.
- **The graph should be minimal.** Only include what reduces manifestation ambiguity. Redundant or derived information belongs in generated artifacts, not the graph.
- **Progressive adoption.** A behavior-only graph is valid. Additional node types are added when the minimality test demands it — when manifestation ambiguity on a dimension the designer cares about requires explicit specification.
- **Declarative truth, not narrative docs.** Every decision that matters becomes a verifiable node in the graph, not prose in a document.

## Success Criteria

The research is complete when the repository contains:

1. A formal description of the Spec Graph theory (completeness, minimality, manifestation determinism).
2. A complete definition of all node types, edge types, and their semantics.
3. JSON schemas for validating the graph.
4. A description of the manifestation process that agents follow.
5. Worked examples demonstrating the framework across realistic features.

These artifacts should be sufficient for an engineering team to implement a Spec Graph-based agentic development platform without further design decisions about the specification format itself.
