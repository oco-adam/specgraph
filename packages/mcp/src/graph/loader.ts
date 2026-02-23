import path from 'node:path';
import { readJson, resolveInside } from '../json.js';
import { DEFAULT_DIRECTORY } from '../constants.js';
import type { GraphIndex, LoadedGraph, NodeRef, SpecNode } from '../types.js';

const cacheTtlMs = Number.parseInt(process.env.SPECGRAPH_MCP_CACHE_TTL_MS ?? '1500', 10);

interface CacheEntry {
  graph: LoadedGraph;
  expiresAt: number;
}

class GraphCache {
  private readonly entries = new Map<string, CacheEntry>();

  async get(repoDir: string, directory: string, forceReload: boolean): Promise<LoadedGraph> {
    const key = this.keyFor(repoDir, directory);
    const now = Date.now();
    const cached = this.entries.get(key);

    if (!forceReload && cached && cached.expiresAt > now) {
      return cached.graph;
    }

    const loaded = await loadGraphFromDisk(repoDir, directory);
    const ttl = Number.isFinite(cacheTtlMs) && cacheTtlMs >= 0 ? cacheTtlMs : 1500;
    this.entries.set(key, { graph: loaded, expiresAt: now + ttl });
    return loaded;
  }

  invalidate(repoDir: string, directory: string): void {
    this.entries.delete(this.keyFor(repoDir, directory));
  }

  private keyFor(repoDir: string, directory: string): string {
    return `${path.resolve(repoDir)}::${directory}`;
  }
}

const cache = new GraphCache();

export async function loadGraph(
  repoDir: string,
  directory: string = DEFAULT_DIRECTORY,
  options: { forceReload?: boolean } = {}
): Promise<LoadedGraph> {
  return cache.get(repoDir, directory, options.forceReload ?? false);
}

export function invalidateGraphCache(repoDir: string, directory: string = DEFAULT_DIRECTORY): void {
  cache.invalidate(repoDir, directory);
}

async function loadGraphFromDisk(repoDir: string, directory: string): Promise<LoadedGraph> {
  const graphDir = path.resolve(repoDir, directory);
  const graphPath = path.join(graphDir, 'graph.json');
  const index = await readJson<GraphIndex>(graphPath);

  if (!Array.isArray(index.nodes)) {
    throw new Error(`Invalid graph index at ${graphPath}: nodes must be an array`);
  }

  const refsById = new Map<string, NodeRef>();
  const nodesById = new Map<string, SpecNode>();

  for (const ref of index.nodes) {
    if (!ref || typeof ref !== 'object') {
      throw new Error(`Invalid node reference in ${graphPath}`);
    }

    if (typeof ref.id !== 'string' || ref.id.length === 0) {
      throw new Error(`Invalid node id in graph index: ${JSON.stringify(ref)}`);
    }

    if (refsById.has(ref.id)) {
      throw new Error(`Duplicate node id in graph index: ${ref.id}`);
    }

    if (typeof ref.path !== 'string' || ref.path.length === 0) {
      throw new Error(`Invalid path for node ${ref.id}`);
    }

    const nodePath = resolveInside(graphDir, ref.path);
    const node = await readJson<SpecNode>(nodePath);

    if (node.id !== ref.id) {
      throw new Error(`Node file id mismatch: ref ${ref.id} != node ${String(node.id)} (${ref.path})`);
    }

    refsById.set(ref.id, ref);
    nodesById.set(ref.id, node);
  }

  return {
    repoDir: path.resolve(repoDir),
    directory,
    graphDir,
    graphPath,
    index,
    refsById,
    nodesById
  };
}
