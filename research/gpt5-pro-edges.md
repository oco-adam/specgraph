In the **SpecGraph v2** shape I described, the cleanest approach is:

* **Edges live on the nodes** (node-local, outbound links).
* `graph.json` is an **index / entrypoint** (and optionally a *generated* adjacency cache), but **not** the canonical place you manually edit relationships.

This keeps edits atomic and reviewable in the same way DLOOP v1 keeps the spec as a repo-first source of truth. 

## Recommended: edges defined inside each node file

Each node declares its own outgoing edges in a `links` block:

```json
// nodes/ARCH/ARCH-01.json
{
  "id": "ARCH-01",
  "type": "architecture_decision",
  "title": "Abstract Agent Provider",
  "statement": "The codebase exposes an AgentProvider interface and all agent calls go through it.",
  "constraints": [
    "A DeterministicProvider exists for repeatable tests."
  ],
  "verification": [
    "lint: no-direct-vendor-imports",
    "npm test -- --grep ARCH-01"
  ],
  "links": {
    "depends_on": ["STACK-01"],
    "constrains": ["BEHAV-AGENTS-01", "TEST-02"]
  }
}
```

### Why this is usually best

* **Atomic PRs**: changing a decision and its dependencies happens in *one file* (less merge conflict than a central edge list).
* **Local reasoning**: when reviewing `ARCH-01`, you see exactly what it depends on / constrains.
* **No duplication**: you treat outbound edges as canonical; reverse edges are computed by tooling.

This matches the spirit of DLOOP’s atomicity and “spec-first” discipline (even though those rules were originally written for behaviors). 

## What goes in graph.json then?

`graph.json` becomes the “directory” + entrypoint configuration:

```json
{
  "specgraphVersion": "2.0.0",
  "root": "EQ-01",
  "nodes": [
    { "id": "EQ-01", "path": "nodes/EQ/EQ-01.json" },
    { "id": "ARCH-01", "path": "nodes/ARCH/ARCH-01.json" },
    { "id": "STACK-01", "path": "nodes/STACK/STACK-01.json" }
  ]
}
```

Optionally, you can also store things like:

* projection config (e.g., generate `SPEC.json` from `behavior` nodes)
* global lint rulesets / policies
* manifestor profile selection

But I would **not** hand-author `edges` here if you can avoid it, because it becomes a hot merge-conflict file.

## Optional: generated “edge index” file (not canonical)

If you want fast graph traversal (or to support dumb tooling), you can generate and commit something like `graph.index.json`:

```json
{
  "edges": [
    { "from": "ARCH-01", "type": "depends_on", "to": "STACK-01" },
    { "from": "ARCH-01", "type": "constrains", "to": "BEHAV-AGENTS-01" }
  ]
}
```

But the rule should be:

* **Source of truth**: node `links`
* **Derived artifact**: `graph.index.json` (CI can verify it matches)

## Alternative (less recommended): define edges centrally in graph.json

You *can* choose a central edge list:

```json
{
  "nodes": [...],
  "edges": [
    { "from": "ARCH-01", "type": "depends_on", "to": "STACK-01" }
  ]
}
```

This is workable if:

* you expect many cross-cutting edges added by an automated planner
* you want to keep nodes extremely minimal

…but it tends to:

* create merge conflicts
* separate “what the node says” from “how it relates”, which makes reviews harder

## Practical rule of thumb

* If a relationship is **part of the node’s meaning** (“this decision depends on that stack”), put it **in the node**.
* If a relationship is **purely derived** or **purely tooling-related**, generate it into an index file.

If you want, I can also propose a tiny “SpecGraph schema” for `graph.json` + node files (including edge type enums and cycle rules like “depends_on must be acyclic”).

