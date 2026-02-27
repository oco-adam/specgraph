import path from 'node:path';
import { DEFAULT_DIRECTORY, EDGE_TYPES } from '../constants.js';
import { readJson, resolveInside } from '../json.js';
import type { GraphIndex, LoadedGraph, SchemaIssue, SpecNode, StructuralIssue, ValidationResult } from '../types.js';
import { findLayerPropagationAmbiguities } from './query.js';
import { formatAjvErrors, getSchemaValidators } from './schema.js';

export async function validateSpecgraph(
  repoDir: string,
  directory: string = DEFAULT_DIRECTORY
): Promise<ValidationResult> {
  const graphDir = path.resolve(repoDir, directory);
  const graphPath = path.join(graphDir, 'graph.json');

  const schemaErrors: SchemaIssue[] = [];
  const structuralIssues: StructuralIssue[] = [];

  const validators = await getSchemaValidators();

  let index: GraphIndex | null = null;
  try {
    index = await readJson<GraphIndex>(graphPath);
  } catch (error) {
    return {
      valid: false,
      total_nodes: 0,
      valid_nodes: 0,
      schema_errors: [
        {
          node_id: 'GRAPH',
          file: 'graph.json',
          errors: [{ path: '/', message: `failed to read graph.json: ${String(error)}` }]
        }
      ],
      structural_issues: []
    };
  }

  const graphIndexValid = validators.validateGraph(index);
  if (!graphIndexValid) {
    schemaErrors.push({
      node_id: 'GRAPH',
      file: 'graph.json',
      errors: formatAjvErrors(validators.validateGraph.errors)
    });
  }

  const nodeRefs = Array.isArray(index.nodes) ? index.nodes : [];
  const nodesById = new Map<string, SpecNode>();
  const invalidNodeIds = new Set<string>();

  for (const ref of nodeRefs) {
    if (!ref || typeof ref !== 'object' || typeof ref.id !== 'string' || typeof ref.path !== 'string') {
      const refDescription = JSON.stringify(ref);
      schemaErrors.push({
        node_id: 'GRAPH',
        file: 'graph.json',
        errors: [{ path: '/nodes', message: `invalid node reference: ${refDescription}` }]
      });
      continue;
    }

    if (nodesById.has(ref.id)) {
      structuralIssues.push({
        node_id: ref.id,
        severity: 'error',
        message: `duplicate node id '${ref.id}' in graph.json`
      });
      invalidNodeIds.add(ref.id);
      continue;
    }

    const absNodePath = resolveInside(graphDir, ref.path);

    let node: SpecNode;
    try {
      node = await readJson<SpecNode>(absNodePath);
    } catch (error) {
      schemaErrors.push({
        node_id: ref.id,
        file: ref.path,
        errors: [{ path: '/', message: `failed to read node file: ${String(error)}` }]
      });
      invalidNodeIds.add(ref.id);
      continue;
    }

    nodesById.set(ref.id, node);

    if (node.id !== ref.id) {
      structuralIssues.push({
        node_id: ref.id,
        severity: 'error',
        message: `graph ref id '${ref.id}' does not match node.id '${String(node.id)}'`
      });
      invalidNodeIds.add(ref.id);
    }

    if (ref.expectedType && String(node.type) !== ref.expectedType) {
      structuralIssues.push({
        node_id: ref.id,
        severity: 'error',
        message: `expectedType mismatch: graph.json=${ref.expectedType}, node.type=${String(node.type)}`
      });
    }

    const nodeValid = validators.validateNode(node);
    if (!nodeValid) {
      schemaErrors.push({
        node_id: ref.id,
        file: ref.path,
        errors: formatAjvErrors(validators.validateNode.errors)
      });
      invalidNodeIds.add(ref.id);
    }
  }

  structuralIssues.push(...validateStructural(nodesById));

  const hasStructuralErrors = structuralIssues.some((issue) => issue.severity === 'error');
  const totalNodes = nodeRefs.length;
  const validNodes = Math.max(0, totalNodes - invalidNodeIds.size);

  return {
    valid: schemaErrors.length === 0 && !hasStructuralErrors,
    total_nodes: totalNodes,
    valid_nodes: validNodes,
    schema_errors: schemaErrors,
    structural_issues: structuralIssues
  };
}

function validateStructural(nodesById: Map<string, SpecNode>): StructuralIssue[] {
  const issues: StructuralIssue[] = [];
  const dependsOnGraph = new Map<string, string[]>();

  for (const [sourceId, node] of nodesById.entries()) {
    const links = node.links;
    if (links === undefined) {
      continue;
    }

    if (!isRecord(links)) {
      issues.push({
        node_id: sourceId,
        severity: 'error',
        message: 'links must be an object when present'
      });
      continue;
    }

    for (const edgeType of EDGE_TYPES) {
      const rawTargets = links[edgeType];
      if (rawTargets === undefined) {
        continue;
      }

      if (!Array.isArray(rawTargets)) {
        issues.push({
          node_id: sourceId,
          severity: 'error',
          message: `links.${edgeType} must be an array`
        });
        continue;
      }

      const targets: string[] = [];
      for (const targetId of rawTargets) {
        if (typeof targetId !== 'string' || targetId.length === 0) {
          issues.push({
            node_id: sourceId,
            severity: 'error',
            message: `links.${edgeType} contains a non-string target`
          });
          continue;
        }

        targets.push(targetId);

        if (targetId === sourceId) {
          issues.push({
            node_id: sourceId,
            severity: 'error',
            message: `self-reference is not allowed in links.${edgeType}`
          });
        }

        if (!nodesById.has(targetId)) {
          issues.push({
            node_id: sourceId,
            severity: 'error',
            message: `${edgeType} target '${targetId}' does not exist in the graph`
          });
        }
      }

      if (edgeType === 'depends_on') {
        dependsOnGraph.set(sourceId, targets);

        if (node.type === 'layer') {
          for (const targetId of targets) {
            const targetNode = nodesById.get(targetId);
            if (!targetNode) {
              continue;
            }

            if (targetNode.type === 'feature') {
              issues.push({
                node_id: sourceId,
                severity: 'error',
                message: `Invalid dependency inversion: layer '${sourceId}' cannot depend_on feature '${targetId}'`
              });
            }
          }
        }
      }
    }
  }

  const cycle = detectDependsOnCycle(dependsOnGraph, nodesById);
  if (cycle) {
    issues.push({
      node_id: cycle[0],
      severity: 'error',
      message: `depends_on cycle detected: ${cycle.join(' -> ')}`
    });
  }

  const graphForPropagation = { nodesById } as LoadedGraph;
  for (const ambiguity of findLayerPropagationAmbiguities(graphForPropagation)) {
    issues.push({
      node_id: ambiguity.target_id,
      severity: 'error',
      message: ambiguity.message
    });
  }

  return issues;
}

function detectDependsOnCycle(
  adjacency: Map<string, string[]>,
  nodesById: Map<string, SpecNode>
): string[] | null {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];

  const dfs = (nodeId: string): string[] | null => {
    if (visited.has(nodeId)) {
      return null;
    }

    if (visiting.has(nodeId)) {
      const idx = stack.indexOf(nodeId);
      return idx >= 0 ? [...stack.slice(idx), nodeId] : [nodeId, nodeId];
    }

    visiting.add(nodeId);
    stack.push(nodeId);

    const targets = adjacency.get(nodeId) ?? [];
    for (const target of targets) {
      if (!nodesById.has(target)) {
        continue;
      }

      const cycle = dfs(target);
      if (cycle) {
        return cycle;
      }
    }

    stack.pop();
    visiting.delete(nodeId);
    visited.add(nodeId);
    return null;
  };

  for (const nodeId of nodesById.keys()) {
    const cycle = dfs(nodeId);
    if (cycle) {
      return cycle;
    }
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
