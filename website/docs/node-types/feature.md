---
sidebar_position: 5
title: Feature Nodes
---

# Feature Nodes

Feature nodes are **non-normative grouping nodes** that organize the graph into logical areas. They are the simplest node type — they have no `statement`, `verification`, or `constraints`.

## Schema

```json
{
  "id": "AUTH",
  "type": "feature",
  "title": "User Authentication",
  "description": "Login, session management, and logout flows",
  "links": {
    "contains": ["AUTH-01", "AUTH-02", "AUTH-03", "DEC-AUTH-01", "DOM-USER-01", "POL-PERF-01"]
  }
}
```

## Fields

| Field | Required | Description |
|---|---|---|
| `id` | Yes | Short uppercase identifier (e.g., `AUTH`, `TASKBOARD`) |
| `type` | Yes | Must be `"feature"` |
| `title` | Yes | Human-readable name (3–100 chars) |
| `description` | Yes | What this feature area covers |
| `links` | No | Outbound edges (typically `contains`) |
| `metadata` | No | Non-normative context |

## Non-Normative

Feature nodes make **no claims about the system**. They don't have expectations, statements, or verification criteria. They exist purely to organize.

This means:

- Removing a feature node doesn't change what gets implemented
- Feature nodes don't participate in the minimality test
- They are organizational sugar, not load-bearing specification

## The `contains` Edge

Features use the `contains` edge to declare their children:

```json
"links": {
  "contains": ["AUTH-01", "AUTH-02", "DEC-AUTH-01", "DOM-USER-01"]
}
```

A feature can contain nodes of **any type**: behaviors, decisions, domains, policies, and extensions.

## ID Conventions

Feature IDs are short uppercase identifiers:

| Feature | ID |
|---|---|
| User Authentication | `AUTH` |
| Task Board | `TASKBOARD` |
| Billing & Payments | `BILLING` |
| Design System | `DESIGNSYSTEM` |
| Platform | `PLATFORM` |

Feature IDs should be recognizable and concise — they serve as the namespace prefix for child node IDs.
