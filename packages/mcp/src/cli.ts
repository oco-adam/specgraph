#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';
import { startStdioServer } from './server.js';

function parseArgs(argv: string[]): { repoDir: string; help: boolean } {
  let repoDir = process.cwd();
  let help = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      help = true;
      continue;
    }

    if (arg === '--repo-dir') {
      const value = argv[i + 1];
      if (!value) {
        throw new Error('--repo-dir requires a value');
      }
      repoDir = path.resolve(value);
      i += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return { repoDir, help };
}

function printHelp(): void {
  process.stdout.write(`specgraph-mcp\n\nUsage:\n  specgraph-mcp [--repo-dir <path>]\n\nOptions:\n  --repo-dir <path>   Repository root directory (default: current directory)\n  -h, --help          Show this help text\n`);
}

async function main(): Promise<void> {
  const { repoDir, help } = parseArgs(process.argv.slice(2));

  if (help) {
    printHelp();
    return;
  }

  await startStdioServer({ repoDir });
}

main().catch((error) => {
  process.stderr.write(`specgraph-mcp failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
