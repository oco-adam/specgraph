# Spec Graph

Spec Graph is a framework for specifying software systems as a directed, typed graph of verifiable nodes.

Instead of relying on scattered prose docs, Spec Graph encodes behaviors, decisions, domains, and policies in JSON nodes connected by typed edges (`contains`, `depends_on`, `constrains`, and others). This makes intent explicit, machine-readable, and agent-native.

## What It Provides

- A minimal but expressive graph model for software specification
- Canonical JSON Schemas (Draft 2020-12) for validation
- Example spec graphs and validation tooling
- An MCP server (`@specgraph/mcp`) for agent-driven querying and editing
- Documentation site with authoring guides and theory

## Core Idea

The graph should be:

- Complete enough that capable agents can manifest systems predictably
- Minimal enough that every node is load-bearing
- Verifiable so normative claims can be checked with pass/fail criteria

## Project Docs

- GitHub Pages site: [https://oco-adam.github.io/specgraph/](https://oco-adam.github.io/specgraph/)

## Quick Validation

From repo root:

```bash
node validate.js
node graph_check.js
```
