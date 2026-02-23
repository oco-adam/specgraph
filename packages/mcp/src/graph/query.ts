import { EDGE_TYPES } from '../constants.js';
import type { EdgeType, LoadedGraph, SpecNode } from '../types.js';

export function listNodes(graph: LoadedGraph): { nodes: Array<{ id: string; type: string; title: string | null; status: string | null }>; count: number } {
  const nodes = Array.from(graph.nodesById.values())
    .map((node) => ({
      id: node.id,
      type: String(node.type),
      title: typeof node.title === 'string' ? node.title : null,
      status: typeof node.status === 'string' ? node.status : null
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  return { nodes, count: nodes.length };
}

export function getNode(graph: LoadedGraph, nodeId: string): SpecNode {
  const node = graph.nodesById.get(nodeId);
  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  return node;
}

export function getFeatureSubgraph(
  graph: LoadedGraph,
  featureId: string
): { feature: SpecNode; children: SpecNode[] } {
  const feature = graph.nodesById.get(featureId);
  if (!feature) {
    throw new Error(`Feature node not found: ${featureId}`);
  }

  if (feature.type !== 'feature') {
    throw new Error(`Node '${featureId}' is not a feature`);
  }

  const visited = new Set<string>([featureId]);
  const queue = [...(feature.links?.contains ?? [])];
  const children: SpecNode[] = [];

  while (queue.length > 0) {
    const id = queue.shift();
    if (!id || visited.has(id)) {
      continue;
    }

    visited.add(id);
    const node = graph.nodesById.get(id);
    if (!node) {
      continue;
    }

    children.push(node);
    for (const next of node.links?.contains ?? []) {
      if (!visited.has(next)) {
        queue.push(next);
      }
    }
  }

  return { feature, children };
}

export function listEdges(graph: LoadedGraph): {
  edges: Array<{ source: string; target: string; edge_type: EdgeType }>;
  count: number;
} {
  const edges: Array<{ source: string; target: string; edge_type: EdgeType }> = [];

  for (const node of graph.nodesById.values()) {
    const links = node.links;
    if (!links || typeof links !== 'object') {
      continue;
    }

    for (const edgeType of EDGE_TYPES) {
      const targets = links[edgeType];
      if (!Array.isArray(targets)) {
        continue;
      }

      for (const target of targets) {
        edges.push({ source: node.id, target, edge_type: edgeType });
      }
    }
  }

  return { edges, count: edges.length };
}

export function searchNodes(
  graph: LoadedGraph,
  query: string
): { nodes: SpecNode[]; count: number } {
  const q = query.trim().toLowerCase();
  if (!q) {
    return { nodes: [], count: 0 };
  }

  const nodes = Array.from(graph.nodesById.values()).filter((node) => {
    const text = [
      node.id,
      stringValue(node.title),
      stringValue(node.description),
      stringValue(node.expectation),
      stringValue(node.statement),
      stringValue(node.verification)
    ]
      .join(' ')
      .toLowerCase();

    return text.includes(q);
  });

  return { nodes, count: nodes.length };
}

function stringValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => (typeof entry === 'string' ? entry : '')).join(' ');
  }

  return '';
}
