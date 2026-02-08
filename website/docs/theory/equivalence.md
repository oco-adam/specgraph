---
sidebar_position: 4
title: Equivalence
---

# Equivalence

Equivalence defines what it means for two manifestations to be "the same system." This is not a simple question — it depends on what dimensions the designer cares about.

## Parameterized Equivalence

Two manifestations M₁ and M₂ are **equivalent** (M₁ ≡ M₂) if they are indistinguishable across every dimension specified in the graph. The equivalence relation is parameterized by the node types present:

- **Behavioral equivalence**: Same observable behavior from the user's perspective
- **Structural equivalence**: Same architectural patterns and module boundaries
- **Technological equivalence**: Same technology stack and usage patterns
- **Domain equivalence**: Same data model, business rules, and vocabulary
- **Constraint equivalence**: Same non-functional characteristics (performance, security, accessibility)

A graph with all core node types approaches **total equivalence** — two manifestations would be indistinguishable in every dimension the designer specified.

## Semantic, Not Byte-Level

The Spec Graph targets **semantic predictability**, not byte-level determinism:

- **Byte-level determinism**: identical source code (rarely achievable, rarely necessary)
- **Semantic predictability**: logically equivalent systems under a declared equivalence contract

Two manifestations can have different variable names, different file structures, and different whitespace — and still be equivalent, because those differences don't affect any dimension the designer specified.

## The Equivalence Contract

For formal use, a Spec Graph can include an `equivalence_contract` extension node that explicitly declares what "same system" means:

- Which tests must pass
- Which invariants must hold
- Which performance budgets must be met
- Which structural properties must be preserved

This makes equivalence **testable** — you can verify whether two manifestations satisfy the contract.

## Levels of Equivalence

In practice, teams operate at different levels of equivalence strictness:

### Level 1: Behavioral Equivalence

The weakest useful level. Two systems do the same things from the user's perspective. Architecture, technology, and design may differ completely.

*Achieved by: behavior nodes only.*

### Level 2: Structural Equivalence

Systems share the same architectural patterns and boundaries. You could swap one implementation for the other without changing the system's module graph.

*Achieved by: behavior + decision nodes.*

### Level 3: Full Dimensional Equivalence

Systems are indistinguishable across all specified dimensions. Same behavior, same structure, same domain model, same constraints satisfied.

*Achieved by: all core node types.*

## Equivalence and Verification

Equivalence is verified through the **verification criteria** on each node. If every node's verification passes for both M₁ and M₂, the systems are equivalent under the graph's implied equivalence relation.

This means verification is not just about testing — it's the mechanism by which equivalence is established. See [Verification](/docs/manifestation/verification) for details.
