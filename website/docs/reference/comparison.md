---
sidebar_position: 4
title: Comparison with Adjacent Concepts
---

# Comparison with Adjacent Concepts

The Spec Graph shares ideas with several existing approaches. This page clarifies the similarities and differences.

## vs. Product Requirements Documents (PRDs)

| Aspect | PRD | Spec Graph |
|---|---|---|
| Format | Prose document | Structured, typed graph |
| Actionability | Requires interpretation | Machine-parseable |
| Verification | Manual review | Every node has pass/fail criteria |
| Granularity | Section-level | Atomic nodes |
| Relationships | Implicit in text | Explicit typed edges |

**Similarity:** Both describe what to build.

**Difference:** PRDs are narrative documents that require human interpretation. The Spec Graph is a structured, machine-actionable specification where every claim is verifiable.

## vs. Architecture Decision Records (ADRs)

| Aspect | ADRs | Spec Graph Decision Nodes |
|---|---|---|
| Purpose | Historical narrative of decisions | Prescriptive, living specification |
| Status | Usually immutable once accepted | Can evolve (draft → approved → deprecated) |
| Verification | None | Required for every decision |
| Relationships | Cross-references in text | Typed edges (depends_on, constrains) |

**Similarity:** Both capture architectural and technical decisions.

**Difference:** ADRs are retrospective records ("We decided X because Y"). Decision nodes are prescriptive specifications ("X must be true, verified by Z").

## vs. Design Tokens

| Aspect | Design Token Systems | Spec Graph Design Token Nodes |
|---|---|---|
| Content | Values (colors, spacing, fonts) | Values + usage rules + relationships |
| Verification | Build-time token validation | Node-level verification criteria |
| Context | Standalone token system | Edges connect tokens to behaviors and constraints |

**Similarity:** Both specify visual properties.

**Difference:** Standard design tokens are values in isolation. Spec Graph design token nodes include usage rules, verification, and edges to the behaviors they constrain.

## vs. Domain-Driven Design (DDD)

| Aspect | DDD | Spec Graph Domain Nodes |
|---|---|---|
| Format | Books, workshops, modeling sessions | Declarative JSON specifications |
| Scope | Methodology and philosophy | Specific data model |
| Output | Mental models, code patterns | Verifiable, machine-readable nodes |

**Similarity:** Both model business concepts and establish ubiquitous language.

**Difference:** DDD is a methodology — a way of thinking about software. Domain nodes are concrete, verifiable specifications that capture the outcomes of domain modeling.

## vs. Infrastructure as Code (IaC)

| Aspect | IaC (Terraform, Pulumi) | Spec Graph |
|---|---|---|
| Scope | Infrastructure resources | Entire system intent |
| Output | Running infrastructure | Running system (via manifestation) |
| Abstraction | Resource-level | Intent-level |

**Similarity:** Both aim for deterministic creation from declarative specifications.

**Difference:** IaC specifies infrastructure resources at a concrete level. The Spec Graph specifies system intent at a higher level — including behavior, architecture, domain, and constraints — leaving the agent to determine the concrete implementation.

## vs. UML / System Modeling

| Aspect | UML | Spec Graph |
|---|---|---|
| Purpose | System documentation and visualization | System specification for manifestation |
| Diagrams | Class, sequence, state, etc. | Node graph with typed edges |
| Verification | None (descriptive) | Every node verifiable |
| Actionability | Reference for humans | Input for implementing agents |

**Similarity:** Both model system structure and relationships.

**Difference:** UML diagrams describe systems for human understanding. Spec Graph nodes prescribe system properties for agent implementation, with mandatory verification.

## vs. OpenAPI / API Specifications

| Aspect | OpenAPI | Spec Graph API Contract Nodes |
|---|---|---|
| Scope | HTTP API surface | Full system specification |
| Detail | Endpoint-level (paths, schemas) | Intent-level (what the API must do) |
| Generation | Code from spec or spec from code | System manifestation from graph |

**Similarity:** Both formally specify API contracts.

**Difference:** OpenAPI is a complete API surface description. Spec Graph API contract nodes capture intent and constraints, leaving implementation details to the agent. The two can complement each other — an API contract node might reference an OpenAPI spec as an artifact.

## vs. BDD / Gherkin

| Aspect | BDD (Given/When/Then) | Spec Graph Behavior Nodes |
|---|---|---|
| Format | Natural language scenarios | Structured JSON with expectation + invariant |
| Scope | User-facing behavior | Multi-dimensional (behavior + architecture + ...) |
| Verification | Scenario runner (Cucumber) | Flexible (commands, HTTP, manual) |

**Similarity:** Both capture observable system behavior.

**Difference:** BDD scenarios focus on user stories. Spec Graph behaviors are part of a larger graph that also captures the non-behavioral dimensions needed for deterministic manifestation.
