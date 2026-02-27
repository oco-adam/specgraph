---
sidebar_position: 1
title: Behavior Nodes
---

# Behavior Nodes

Behavior nodes are the foundation of the Spec Graph. They capture **observable system behavior** from the user's perspective — what the system does, not how it does it.

## Schema

```json
{
  "id": "AUTH-01",
  "type": "behavior",
  "title": "Login Form Display",
  "expectation": "Login page renders email and password input fields with a submit button",
  "constraints": ["Password field must mask input characters"],
  "verification": "npm test -- --grep AUTH-01",
  "links": {
    "implements": ["DOM-USER-01"],
    "depends_on": ["DEC-AUTH-01"]
  }
}
```

## Fields

| Field | Required | Description |
|---|---|---|
| `id` | Yes | Unique identifier (e.g., `AUTH-01`, `TASKBOARD-03`) |
| `type` | Yes | Must be `"behavior"` |
| `title` | Yes | Short human-readable name (3–100 chars) |
| `expectation` | Yes | WHAT the system does (min 10 chars) |
| `constraints` | No | Normative conditions that must hold for this behavior. Authoring convention: include explicitly; use `[]` when none. |
| `verification` | Yes | Single pass/fail check (min 5 chars) |
| `links` | No | Outbound edges to other nodes |
| `metadata` | No | Non-normative context (rationale, notes, tags) |

## The ONE Rule

Behavior nodes follow the **ONE rule** from DLOOP v1:

> **ONE trigger → ONE behavior → ONE outcome**

A behavior node describes exactly one observable thing the system does. If the expectation contains "and" connecting two distinct behaviors, split it into two nodes.

**Good:**
```
"expectation": "Login page renders email and password input fields with a submit button"
```
This is one observable state — the login form.

**Bad:**
```
"expectation": "Login page renders a form and validates email on submit and redirects on success"
```
This is three behaviors. Split into: form display, email validation, and redirect.

## Expectation vs. Constraints

- **Expectation**: describes WHAT happens — the observable behavior
- **Constraints**: conditions that must hold for this behavior — guard rails, not additional behaviors

The constraints are not second behaviors — they are side-conditions on the expectation.
"Password field must mask input characters" constrains how the login form is displayed,
not what happens when you submit it.

Schema compatibility: a behavior with no constraints may omit the field.
Authoring convention for agent interoperability: include `constraints` explicitly and use an empty array (`[]`) when none apply.
There is no need for a `"None"` sentinel.

### Temporal specificity

Constraints are normative — an implementor must respect them. But not all conditions
hold at all times. The condition's own language carries its temporal semantics:

| Condition | Temporal profile |
|-----------|--------------------|
| "Form fields remain disabled during submission" | **Immediate** — must hold at all times during the operation |
| "Email must be eventually unique" | **Eventual** — converges after the operation; brief violations during convergence are acceptable |
| "Confirmation email is sent within 30 seconds" | **Bounded** — must complete within a time window |

All three are normative and testable. The enforcement model is encoded in the
condition text, not in the field name or type.

#### Example: immediate and eventual constraints on the same behavior

```json
{
  "type": "behavior",
  "id": "REG-01",
  "title": "User Registration",
  "expectation": "When user submits valid registration form, an account is created and confirmation email is sent",
  "constraints": [
    "Form fields remain disabled during submission",
    "Email must be eventually unique",
    "Confirmation email is sent within 30 seconds"
  ]
}
```

Three constraints with three different temporal profiles — all normative, all testable,
none contradicted by the field name.

If the choice of enforcement model (strong vs. eventual consistency, database vs.
application-level) is itself a dangerous completeness gap, capture it as a
**decision node** — that's what decisions are for. See the
[Conditions, Enforcement, and Strictness](/docs/authoring/writing-nodes#conditions-enforcement-and-strictness)
section for the full pattern.

:::info Disambiguation: `constraints` field vs policy nodes vs `constrains` edges

The spec graph uses related but distinct concepts:

| Concept | What it is | Scope |
|---------|-----------|-------|
| `constraints` field | Array of normative conditions on a single node | Narrows THIS node's `expectation` or `statement` |
| Policy node (`type: "policy"`) | A standalone node for cross-cutting NFRs | Affects OTHER nodes via `constrains` edges; has `severity` (hard/soft) |
| `constrains` edge | A graph relationship | Declares that the source node narrows implementation choices for the target |

**Decision rule:**
- Condition specific to one node → `constraints` field entry on that node
- Cross-cutting requirement affecting multiple nodes → policy node with `constrains` edges
- Expressing that one node limits another → `constrains` edge

:::

## Verification

Each behavior has a single verification string — typically an executable test command:

```json
"verification": "npm test -- --grep AUTH-01"
```

For behaviors that are harder to test programmatically, the verification can be a description of a manual check:

```json
"verification": "Visual inspection: login form matches wireframe layout"
```

Prefer executable verification wherever possible.

## Common Edge Patterns

| Edge | Direction | Meaning |
|---|---|---|
| `implements` | behavior → domain | This behavior realizes a domain concept |
| `depends_on` | behavior → behavior | Must be implemented after the dependency |
| `depends_on` | behavior → decision | Requires this architectural decision |

Behaviors are typically the **most connected** nodes in the graph — they reference the decisions that guide their implementation, the domain concepts they realize, and the constraints that limit them.

## ID Conventions

Behavior IDs follow the pattern `FEATURE-##`:

| Feature | Behavior IDs |
|---|---|
| AUTH | `AUTH-01`, `AUTH-02`, `AUTH-03` |
| TASKBOARD | `TASKBOARD-01`, `TASKBOARD-02` |
| BILLING | `BILLING-01`, `BILLING-02` |
