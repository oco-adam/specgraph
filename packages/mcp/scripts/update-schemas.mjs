#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, '..');
const outDir = path.join(packageRoot, 'schemas');
const base = process.env.SPECGRAPH_MCP_SCHEMA_BASE_URL ?? 'https://oco-adam.github.io/specgraph/schemas/';

const files = ['graph.schema.json', 'node.schema.json'];

await mkdir(outDir, { recursive: true });

for (const name of files) {
  const url = new URL(name, base).toString();
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
  }

  const body = await res.text();
  await writeFile(path.join(outDir, name), body, 'utf8');
  console.error(`Updated ${name} from ${url}`);
}
