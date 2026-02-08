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
  "invariant": "Password field must mask input characters",
  "verification": "npm test -- --grep AUTH-01",
  "status": "approved",
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
| `invariant` | Yes | Hard constraint that must always hold, or `"None"` |
| `verification` | Yes | Single pass/fail check (min 5 chars) |
| `status` | Yes | Lifecycle status: draft, proposed, approved, deprecated, rejected |
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

## Expectation vs. Invariant

- **Expectation**: describes WHAT happens — the observable behavior
- **Invariant**: describes a constraint that must ALWAYS hold during this behavior, or `"None"`

The invariant is not a second behavior — it's a guard rail. "Password field must mask input characters" constrains how the login form is displayed, not what happens when you submit it.

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
