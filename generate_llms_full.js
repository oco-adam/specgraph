#!/usr/bin/env node

/**
 * Generates llms-full.txt by concatenating all documentation pages
 * in sidebar order. Run from the repo root:
 *
 *   node generate_llms_full.js
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, 'website', 'docs');
const OUTPUT = path.join(__dirname, 'llms-full.txt');

// Sidebar order — matches sidebars.ts
const pages = [
  'introduction/index.md',
  'introduction/motivation.md',
  'introduction/design-principles.md',
  'theory/completeness.md',
  'theory/minimality.md',
  'theory/completeness-gap.md',
  'theory/equivalence.md',
  'graph/structure.md',
  'graph/node-types-overview.md',
  'graph/edge-types.md',
  'graph/features-and-namespaces.md',
  'node-types/behavior.md',
  'node-types/decision.md',
  'node-types/domain.md',
  'node-types/constraint.md',
  'node-types/feature.md',
  'node-types/extensions.md',
  'authoring/writing-nodes.md',
  'authoring/atomicity-rules.md',
  'authoring/when-to-add-nodes.md',
  'authoring/directory-layout.md',
  'manifestation/overview.md',
  'manifestation/orient-scaffold-implement.md',
  'manifestation/context-assembly.md',
  'manifestation/verification.md',
  'guides/getting-started.md',
  'guides/progressive-adoption.md',
  'guides/from-dloop-v1.md',
  'reference/json-schemas.md',
  'reference/examples.md',
  'reference/glossary.md',
  'reference/comparison.md',
];

function stripFrontmatter(content) {
  if (content.startsWith('---')) {
    const end = content.indexOf('---', 3);
    if (end !== -1) {
      return content.slice(end + 3).trim();
    }
  }
  return content.trim();
}

function main() {
  const parts = [
    '# Spec Graph — Complete Documentation',
    '',
    '> The minimal specification framework for deterministic system manifestation.',
    '',
    `> Generated: ${new Date().toISOString().split('T')[0]}`,
    '',
    '---',
    '',
  ];

  for (const page of pages) {
    const filePath = path.join(DOCS_DIR, page);
    if (!fs.existsSync(filePath)) {
      console.warn(`WARNING: Missing page: ${page}`);
      continue;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const content = stripFrontmatter(raw);
    parts.push(content);
    parts.push('');
    parts.push('---');
    parts.push('');
  }

  fs.writeFileSync(OUTPUT, parts.join('\n'), 'utf8');
  console.log(`Generated ${OUTPUT} (${pages.length} pages)`);
}

main();
