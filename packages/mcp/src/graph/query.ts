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

export function getEffectiveConstraints(
  graph: LoadedGraph,
  nodeId: string
): {
  node_id: string;
  contains_ancestors: string[];
  constraining_nodes: Array<{
    id: string;
    type: string;
    title: string | null;
    severity: string | null;
    statement: string | null;
    direct: boolean;
    via_targets: string[];
  }>;
  warnings: string[];
  count: number;
} {
  const node = graph.nodesById.get(nodeId);
  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  const parentsByChild = new Map<string, string[]>();
  for (const sourceNode of graph.nodesById.values()) {
    for (const childId of sourceNode.links?.contains ?? []) {
      const parents = parentsByChild.get(childId) ?? [];
      parents.push(sourceNode.id);
      parentsByChild.set(childId, parents);
    }
  }

  const ancestry = new Set<string>([nodeId]);
  const queue = [nodeId];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    for (const parentId of parentsByChild.get(current) ?? []) {
      if (ancestry.has(parentId)) {
        continue;
      }
      ancestry.add(parentId);
      queue.push(parentId);
    }
  }

  type ConstraintMatch = {
    id: string;
    type: string;
    title: string | null;
    severity: string | null;
    statement: string | null;
    direct: boolean;
    via_targets: Set<string>;
  };

  const matches = new Map<string, ConstraintMatch>();

  for (const sourceNode of graph.nodesById.values()) {
    const targets = sourceNode.links?.constrains;
    if (!Array.isArray(targets) || targets.length === 0) {
      continue;
    }

    const matchedTargets = targets.filter((targetId) => ancestry.has(targetId));
    if (matchedTargets.length === 0) {
      continue;
    }

    const existing = matches.get(sourceNode.id);
    if (!existing) {
      matches.set(sourceNode.id, {
        id: sourceNode.id,
        type: String(sourceNode.type),
        title: typeof sourceNode.title === 'string' ? sourceNode.title : null,
        severity: typeof sourceNode.severity === 'string' ? sourceNode.severity : null,
        statement: typeof sourceNode.statement === 'string' ? sourceNode.statement : null,
        direct: matchedTargets.includes(nodeId),
        via_targets: new Set(matchedTargets)
      });
      continue;
    }

    if (matchedTargets.includes(nodeId)) {
      existing.direct = true;
    }

    for (const targetId of matchedTargets) {
      existing.via_targets.add(targetId);
    }
  }

  const constrainingNodes = Array.from(matches.values())
    .map((entry) => ({
      id: entry.id,
      type: entry.type,
      title: entry.title,
      severity: entry.severity,
      statement: entry.statement,
      direct: entry.direct,
      via_targets: Array.from(entry.via_targets).sort()
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  return {
    node_id: nodeId,
    contains_ancestors: Array.from(ancestry).filter((id) => id !== nodeId).sort(),
    constraining_nodes: constrainingNodes,
    warnings: collectSeverityWarnings(constrainingNodes),
    count: constrainingNodes.length
  };
}

export function listDependencies(
  graph: LoadedGraph,
  nodeId: string
): {
  node_id: string;
  dependencies: Array<{ id: string; type: string | null; title: string | null }>;
  missing_dependencies: string[];
  count: number;
} {
  const node = graph.nodesById.get(nodeId);
  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  const dependencies = uniqueTargets(node.links?.depends_on);
  const summaries: Array<{ id: string; type: string | null; title: string | null }> = [];
  const missing: string[] = [];

  for (const depId of dependencies) {
    const depNode = graph.nodesById.get(depId);
    if (!depNode) {
      missing.push(depId);
      continue;
    }
    summaries.push(nodeSummary(depNode));
  }

  summaries.sort((a, b) => a.id.localeCompare(b.id));
  missing.sort();

  return {
    node_id: nodeId,
    dependencies: summaries,
    missing_dependencies: missing,
    count: summaries.length
  };
}

export function listDependenciesFull(
  graph: LoadedGraph,
  nodeId: string
): {
  node_id: string;
  direct_dependencies: string[];
  dependency_nodes: Array<{ id: string; type: string | null; title: string | null; depth: number }>;
  decisions: Array<{ id: string; type: string | null; title: string | null; depth: number }>;
  policies: Array<{ id: string; type: string | null; title: string | null; depth: number }>;
  effective_constraint_nodes: Array<{
    id: string;
    type: string;
    title: string | null;
    severity: string | null;
    statement: string | null;
    applies_to: string[];
  }>;
  effective_decisions: Array<{
    id: string;
    type: string;
    title: string | null;
    severity: string | null;
    statement: string | null;
    applies_to: string[];
  }>;
  effective_policies: Array<{
    id: string;
    type: string;
    title: string | null;
    severity: string | null;
    statement: string | null;
    applies_to: string[];
  }>;
  missing_dependencies: string[];
  warnings: string[];
  depends_on_edges: Array<{ source: string; target: string }>;
  count: {
    direct_dependencies: number;
    transitive_dependencies: number;
    effective_constraints: number;
  };
} {
  const node = graph.nodesById.get(nodeId);
  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  const directDependencies = uniqueTargets(node.links?.depends_on);
  const visited = new Set<string>();
  const missing = new Set<string>();
  const depthById = new Map<string, number>();
  const queue: Array<{ id: string; depth: number }> = directDependencies.map((id) => ({ id, depth: 1 }));
  const dependsOnEdges: Array<{ source: string; target: string }> = directDependencies.map((target) => ({
    source: nodeId,
    target
  }));

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    if (visited.has(current.id)) {
      const existingDepth = depthById.get(current.id);
      if (existingDepth !== undefined && current.depth < existingDepth) {
        depthById.set(current.id, current.depth);
      }
      continue;
    }

    visited.add(current.id);
    depthById.set(current.id, current.depth);

    const depNode = graph.nodesById.get(current.id);
    if (!depNode) {
      missing.add(current.id);
      continue;
    }

    for (const next of uniqueTargets(depNode.links?.depends_on)) {
      dependsOnEdges.push({ source: depNode.id, target: next });
      if (!visited.has(next)) {
        queue.push({ id: next, depth: current.depth + 1 });
      }
    }
  }

  const dependencyNodes = Array.from(visited)
    .map((id) => {
      const depNode = graph.nodesById.get(id);
      return {
        id,
        type: depNode ? String(depNode.type) : null,
        title: depNode && typeof depNode.title === 'string' ? depNode.title : null,
        depth: depthById.get(id) ?? 1
      };
    })
    .sort((a, b) => (a.depth !== b.depth ? a.depth - b.depth : a.id.localeCompare(b.id)));

  const decisions = dependencyNodes.filter((entry) => entry.type === 'decision');
  const policies = dependencyNodes.filter((entry) => entry.type === 'policy');

  type EffectiveConstraintNode = {
    id: string;
    type: string;
    title: string | null;
    severity: string | null;
    statement: string | null;
    applies_to: Set<string>;
  };

  const effectiveConstraintMap = new Map<string, EffectiveConstraintNode>();
  const warnings = new Set<string>();
  const contextTargets = [nodeId, ...dependencyNodes.map((entry) => entry.id)];

  for (const targetId of contextTargets) {
    const effective = getEffectiveConstraints(graph, targetId);
    for (const warning of effective.warnings) {
      warnings.add(warning);
    }

    for (const constraint of effective.constraining_nodes) {
      const existing = effectiveConstraintMap.get(constraint.id);
      if (!existing) {
        effectiveConstraintMap.set(constraint.id, {
          id: constraint.id,
          type: constraint.type,
          title: constraint.title,
          severity: constraint.severity,
          statement: constraint.statement,
          applies_to: new Set([targetId])
        });
        continue;
      }
      existing.applies_to.add(targetId);
    }
  }

  const effectiveConstraintNodes = Array.from(effectiveConstraintMap.values())
    .map((entry) => ({
      id: entry.id,
      type: entry.type,
      title: entry.title,
      severity: entry.severity,
      statement: entry.statement,
      applies_to: Array.from(entry.applies_to).sort()
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const effectiveDecisions = effectiveConstraintNodes.filter((entry) => entry.type === 'decision');
  const effectivePolicies = effectiveConstraintNodes.filter((entry) => entry.type === 'policy');

  return {
    node_id: nodeId,
    direct_dependencies: directDependencies,
    dependency_nodes: dependencyNodes,
    decisions,
    policies,
    effective_constraint_nodes: effectiveConstraintNodes,
    effective_decisions: effectiveDecisions,
    effective_policies: effectivePolicies,
    missing_dependencies: Array.from(missing).sort(),
    warnings: Array.from(warnings),
    depends_on_edges: dependsOnEdges,
    count: {
      direct_dependencies: directDependencies.length,
      transitive_dependencies: dependencyNodes.length,
      effective_constraints: effectiveConstraintNodes.length
    }
  };
}

export function getAffectingNodes(
  graph: LoadedGraph,
  nodeId: string
): {
  node_id: string;
  affecting_nodes: Array<{
    id: string;
    type: string | null;
    title: string | null;
    reasons: string[];
  }>;
  groups: {
    depends_on_transitive: string[];
    constraining_nodes: string[];
    contains_ancestors: string[];
    implements_targets: string[];
    verified_by_targets: string[];
    derived_from_targets: string[];
    superseded_by: string[];
  };
  count: number;
} {
  const node = graph.nodesById.get(nodeId);
  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  const dependencyContext = listDependenciesFull(graph, nodeId);
  const effectiveConstraints = getEffectiveConstraints(graph, nodeId);

  const implementsTargets = uniqueTargets(node.links?.implements);
  const verifiedByTargets = uniqueTargets(node.links?.verified_by);
  const derivedFromTargets = uniqueTargets(node.links?.derived_from);
  const supersededBy = listInboundSources(graph, 'supersedes', nodeId);

  type AffectingNode = {
    id: string;
    type: string | null;
    title: string | null;
    reasons: Set<string>;
  };

  const map = new Map<string, AffectingNode>();

  const add = (id: string, reason: string): void => {
    const ref = graph.nodesById.get(id);
    if (!ref) {
      return;
    }

    const existing = map.get(id);
    if (!existing) {
      map.set(id, {
        id,
        type: typeof ref.type === 'string' ? ref.type : null,
        title: typeof ref.title === 'string' ? ref.title : null,
        reasons: new Set([reason])
      });
      return;
    }

    existing.reasons.add(reason);
  };

  for (const dep of dependencyContext.dependency_nodes) {
    add(dep.id, 'depends_on');
  }

  for (const constraint of effectiveConstraints.constraining_nodes) {
    add(constraint.id, constraint.direct ? 'constrains_direct' : 'constrains_inherited');
  }

  for (const ancestorId of effectiveConstraints.contains_ancestors) {
    add(ancestorId, 'contains_ancestor');
  }

  for (const targetId of implementsTargets) {
    add(targetId, 'implements_target');
  }

  for (const targetId of verifiedByTargets) {
    add(targetId, 'verified_by_target');
  }

  for (const targetId of derivedFromTargets) {
    add(targetId, 'derived_from_target');
  }

  for (const sourceId of supersededBy) {
    add(sourceId, 'superseded_by');
  }

  const affectingNodes = Array.from(map.values())
    .map((entry) => ({
      id: entry.id,
      type: entry.type,
      title: entry.title,
      reasons: Array.from(entry.reasons).sort()
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  return {
    node_id: nodeId,
    affecting_nodes: affectingNodes,
    groups: {
      depends_on_transitive: dependencyContext.dependency_nodes.map((entry) => entry.id),
      constraining_nodes: effectiveConstraints.constraining_nodes.map((entry) => entry.id),
      contains_ancestors: effectiveConstraints.contains_ancestors,
      implements_targets: implementsTargets,
      verified_by_targets: verifiedByTargets,
      derived_from_targets: derivedFromTargets,
      superseded_by: supersededBy
    },
    count: affectingNodes.length
  };
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
      stringValue(node.verification),
      metadataSearchText(node.metadata)
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

function metadataSearchText(metadata: unknown): string {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return '';
  }

  const record = metadata as Record<string, unknown>;
  const rejected = Array.isArray(record.rejected_alternatives)
    ? record.rejected_alternatives
    : [];

  return [
    stringValue(record.rationale),
    stringValue(record.notes),
    stringValue(record.owner),
    stringValue(record.tags),
    rejected
      .map((entry) => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
          return '';
        }
        const alt = entry as Record<string, unknown>;
        return `${stringValue(alt.title)} ${stringValue(alt.reason)}`.trim();
      })
      .join(' ')
  ]
    .join(' ')
    .trim();
}

function collectSeverityWarnings(
  constraints: Array<{
    id: string;
    type: string;
    severity: string | null;
    statement: string | null;
  }>
): string[] {
  const warnings: string[] = [];
  const byStatement = new Map<string, { hard: string[]; soft: string[] }>();

  for (const node of constraints) {
    if (node.type !== 'policy' || !node.statement || !node.severity) {
      continue;
    }

    const key = node.statement.trim().toLowerCase();
    if (!key) {
      continue;
    }

    const bucket = byStatement.get(key) ?? { hard: [], soft: [] };
    if (node.severity === 'hard') {
      bucket.hard.push(node.id);
    } else if (node.severity === 'soft') {
      bucket.soft.push(node.id);
    }
    byStatement.set(key, bucket);
  }

  for (const [statement, bucket] of byStatement.entries()) {
    if (bucket.hard.length > 0 && bucket.soft.length > 0) {
      warnings.push(
        `Severity overlap detected for statement "${statement}": hard policies (${bucket.hard.join(
          ', '
        )}) override soft policies (${bucket.soft.join(', ')}).`
      );
    }
  }

  return warnings;
}

function uniqueTargets(targets: string[] | undefined): string[] {
  if (!Array.isArray(targets)) {
    return [];
  }
  return Array.from(new Set(targets.filter((target): target is string => typeof target === 'string' && target.length > 0)));
}

function nodeSummary(node: SpecNode): { id: string; type: string | null; title: string | null } {
  return {
    id: node.id,
    type: typeof node.type === 'string' ? node.type : null,
    title: typeof node.title === 'string' ? node.title : null
  };
}

function listInboundSources(graph: LoadedGraph, edgeType: EdgeType, targetId: string): string[] {
  const sources: string[] = [];
  for (const node of graph.nodesById.values()) {
    const targets = node.links?.[edgeType];
    if (!Array.isArray(targets)) {
      continue;
    }
    if (targets.includes(targetId)) {
      sources.push(node.id);
    }
  }
  return Array.from(new Set(sources)).sort();
}
