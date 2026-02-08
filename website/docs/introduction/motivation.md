---
sidebar_position: 2
title: Motivation
---

# Motivation

## The Problem with Behavior-Only Specs

Declarative behavioral specifications — where each entry describes WHAT the system does from the user's perspective — are powerful. They are atomic, testable, and reviewable. But they leave critical information stranded in implicit side-channels:

| What's Missing | Where It Lives Today | Why It Matters |
|---|---|---|
| Architectural patterns | Agent instructions, tech stack profiles | Two agents given the same behavioral spec may produce architecturally incompatible implementations |
| Design system | Scattered docs, component libraries, agent prompts | Visual consistency requires shared design knowledge that behaviors don't capture |
| Technology choices | Tech stack profiles, CLAUDE.md, package.json | "Build a login form" manifests very differently in Next.js vs. Phoenix LiveView |
| Domain model | Implicit in code, sometimes in docs | Business concepts and their relationships constrain valid implementations |
| Non-functional requirements | Constraint nodes in agent instructions | Performance and security budgets shape every implementation decision |

## The Consequence

When you re-manifest a system from its behavioral spec alone, you get a system that **does the right things** but may do them in incompatible, inconsistent, or suboptimal ways.

Consider two agents implementing the same behavioral spec for user authentication:

- **Agent A** wraps Clerk behind an abstract `AuthProvider` interface, uses optimistic session caching, and enforces route protection via middleware
- **Agent B** calls Clerk directly throughout the codebase, checks sessions synchronously on every render, and scatters auth guards across individual components

Both produce correct behavior. But the systems are architecturally different, inconsistently structured, and impossible to maintain as a single codebase. The behavioral spec was _necessary_ but not _sufficient_ for predictable manifestation.

## The Shadow Spec

In practice, teams compensate by creating a **shadow spec** — a mishmash of documents, agent instructions, tech stack profiles, PR review comments, and senior engineer guidance that fills the gaps the behavioral spec leaves. This shadow spec:

- Is **scattered** across multiple locations and formats
- Is **mutable** and often unversioned
- Is **implicit** — different team members carry different pieces
- **Drifts** from the actual system over time
- Cannot be **validated** or **verified** programmatically

The shadow spec is the gap between what the behavioral spec says and what you actually need to know to build the system right.

## The Goal

The Spec Graph eliminates the shadow spec by making every load-bearing decision explicit, reviewable, and verifiable:

> **Define a specification framework where the spec determines all decisions the designer cares about, across every dimension — not just behavior.**

This is the Spec Graph: a multi-dimensional specification that captures behavior alongside the architecture, design, technology, domain, and constraints that together determine the intended system.
