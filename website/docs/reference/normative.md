---
sidebar_position: 3
title: Normative
---

# Normative

In Spec Graph, **normative** means: a statement that is required for conformance.

If content is normative, an implementing agent or team must treat it as binding:

- it must be implemented
- it must be respected during manifestation
- it must pass its verification criteria

## Normative Content

In practice, these fields are normative:

- `expectation` (behavior nodes)
- `statement` (contract-style nodes)
- `constraints`
- `verification`

If two implementations differ on normative content, they are not equivalent under the same spec graph.

## Informative Content

Informative content explains intent and context, but does not impose implementation requirements.

Typical informative fields include:

- `metadata.rationale`
- `metadata.notes`
- optional contextual metadata (tags, ownership, references)

Informative content can guide humans and agents, but it is not itself a conformance target.

## Non-Normative Content

Grouping nodes are non-normative organizational structure:

- `feature`
- `layer`

These nodes shape navigation and scope, not runtime behavior.

## Quick Test

Use this test when deciding if content is normative:

1. If this statement is violated, is the implementation non-conformant?
2. If yes, it is normative.
3. If no, it is informative/non-normative.

## Why This Distinction Matters

Clear normative boundaries prevent ambiguity during manifestation. They keep the graph executable as a contract, while still allowing supporting context for collaboration and review.
