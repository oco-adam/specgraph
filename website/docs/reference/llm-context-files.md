---
title: LLM Context Files
---

# LLM Context Files

Spec Graph publishes two text files specifically for AI agent context loading.

## Available Files

- [llms.txt](https://oco-adam.github.io/specgraph/llms.txt) — concise summary of the framework, key concepts, and canonical links
- [llms-full.txt](https://oco-adam.github.io/specgraph/llms-full.txt) — full documentation bundle concatenated into one file

## When to Use Which

- Use `llms.txt` for lightweight orientation and quick context bootstrap
- Use `llms-full.txt` when an agent needs complete project documentation in a single artifact

## Source of Truth

- `llms.txt` is maintained at `website/static/llms.txt`
- `llms-full.txt` is generated from docs via `node generate_llms_full.js`

On deploy, `llms-full.txt` is copied into `website/static/llms-full.txt`, which makes it available at `/llms-full.txt` on GitHub Pages.
