---
sidebar_position: 3
title: Glossary
---

# Glossary

| Term | Definition |
|---|---|
| **Spec Graph** | A directed, typed graph of specification nodes that completely describes a software system across multiple dimensions. |
| **Node** | A single specification entry with a type, ID, and content. The atomic unit of the spec graph. |
| **Edge** | A typed, directed relationship between two nodes. Stored as outbound links inside the source node. |
| **Feature** | A non-normative grouping node that organizes related nodes into a namespace. |
| **Manifestation** | The process of producing a running system from a spec graph. Encompasses planning, coding, building, testing, and deploying. |
| **Completeness** | The property that manifestation is predictable across all specified dimensions — any two manifestations from the same graph are equivalent. |
| **Minimality** | The property that no node can be removed without breaking completeness. Every node is load-bearing. |
| **Completeness Gap** | The set of decisions left to the implementing agent — decisions the spec graph does not determine. |
| **Load-bearing** | A node whose removal would create manifestation ambiguity. |
| **Equivalence** | The relation between two manifestations that makes them "the same system" across all dimensions specified in the graph. |
| **Equivalence Contract** | An optional extension node that formally declares what "same system" means for this graph. |
| **Implementing Agent** | The agent (human or AI) that processes the spec graph to produce a running system. |
| **Capable Agent** | An implementing agent that can parse, traverse, apply, respect, and verify the spec graph. |
| **Contract Node** | The unified shape shared by all non-feature, non-behavior node types (decision, domain, policy, extensions). |
| **Decision Node** | A node capturing an architectural, technical, or stack decision that narrows the solution space. |
| **Domain Node** | A node defining a business concept, term, or rule — the ubiquitous language of the system. |
| **Policy Node** | A node specifying a cross-cutting non-functional requirement (performance, security, accessibility, cost, reliability). Uses `severity` (hard/soft) and `constrains` edges. Not to be confused with the `constraints` field. |
| **Constraints (field)** | Normative conditions on a node that narrow its primary field (`expectation` or `statement`). Each entry is independent and testable. Present on both behavior and contract node shapes. Not to be confused with policy nodes (a node type for cross-cutting NFRs). |
| **Extension Type** | An optional node type for finer-grained modelling (design_token, api_contract, data_model, etc.). |
| **Verification** | Pass/fail criteria attached to a node. The mechanism by which equivalence is established. |
| **Normative** | Content that MUST be true, MUST be implemented, MUST pass verification (expectation, statement, constraints, verification). |
| **Informative** | Content that provides context but is not a requirement (metadata.rationale, metadata.notes). |
| **Orient** | The first manifestation phase: read all nodes to build system understanding. |
| **Scaffold** | The second manifestation phase: create architectural infrastructure from decision and domain nodes. |
| **Implement** | The third manifestation phase: build each behavior with full graph context. |
| **Context Assembly** | The process of gathering all related nodes for a behavior by following edges. |
| **Forward Edge** | An edge stored in the source node's links field. The canonical storage representation (not a traversal restriction). |
| **Inverse Edge** | An edge computed by tooling from forward edges. Never stored. |
| **Progressive Adoption** | The practice of starting with behavior nodes and adding other types as needed. |
| **The ONE Rule** | Atomicity rule for behaviors: ONE trigger, ONE behavior, ONE outcome. |
| **Minimality Test** | "If I removed this node, could a competent agent make a choice I wouldn't want?" |
| **Shadow Spec** | The scattered, mutable, implicit collection of documents and knowledge that fills gaps left by a behavior-only spec. |
| **Severity** | For policy nodes: `hard` (blocks manifestation) or `soft` (quality target). |
