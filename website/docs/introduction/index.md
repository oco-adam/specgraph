---
sidebar_position: 1
title: Introduction
slug: /introduction
---

# Spec Graph

The **Spec Graph** is a formal specification framework for predictable, automated, agent-driven software development. It extends behavior-only specifications into a multi-dimensional graph that captures everything required to predictably manifest a system: behavior, architecture, design, technology choices, domain concepts, and constraints.

## The Core Idea

A Spec Graph is a directed, typed graph where:

- **Nodes** are atomic specification entries — each one captures a single decision, behavior, concept, or constraint
- **Edges** express typed relationships between nodes — dependency, constraint, implementation, containment
- **Features** are namespaces that group related nodes across types

```mermaid
graph TD
    F[AUTH Feature] --> B1[AUTH-01: Login Form]
    F --> B2[AUTH-02: Email Validation]
    F --> D1[DEC-AUTH-01: Auth Provider Interface]
    F --> DOM1[DOM-USER-01: User Account]
    F --> C1[CON-PERF-01: Page Load Budget]

    B1 -->|implements| DOM1
    B1 -->|depends_on| D1
    D1 -->|constrains| B1
    C1 -->|constrains| B1
```

## The Defining Property

> **The Spec Graph is the minimal structure that, when processed by a capable implementing agent, will always produce logically equivalent manifestations of the designer's intended system.**

Two agents given the same spec graph should produce systems that are indistinguishable across every dimension the designer specified — same behaviors, same architecture, same visual presentation, same domain semantics.

## What This Framework Produces

The Spec Graph framework is a **design specification**, not running code. It produces:

1. **Formal theory** — completeness, minimality, predictable manifestation
2. **Data model** — node types, edge types, and their schemas
3. **JSON Schemas** — for validating spec graph files
4. **Manifestation process** — how agents traverse and implement the graph
5. **Worked examples** — realistic spec graphs demonstrating the framework

These artifacts are sufficient for an engineering team to build a Spec Graph-based agentic development platform without further design decisions about the specification format.

## Quick Start

If you want to jump straight in:

1. Read [Motivation](/docs/introduction/motivation) to understand the problem
2. Explore the [Graph Structure](/docs/graph/structure) to see how it works
3. Check the [Getting Started](/docs/guides/getting-started) guide to write your first spec graph

## Background

The Spec Graph builds on lessons from [DLOOP v1](https://github.com/omnifiedLtd/selfimloop), a declarative agentic development framework that used behavior-only specifications. DLOOP v1 demonstrated the value of atomic, declarative specs driving automated development — but limiting specs to behavior alone left too many decisions unspecified. The Spec Graph is a clean-sheet redesign that addresses this completeness gap.
