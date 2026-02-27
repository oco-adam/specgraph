import { EDGE_TYPES } from '../constants.js';
import type { EdgeType, LoadedGraph, SpecNode } from '../types.js';

interface GraphIndexes {
  containsByParent: Map<string, string[]>;
  parentsByChild: Map<string, string[]>;
}

interface LayerDependency {
  id: string;
  distance: number;
  path: string[];
}

interface InternalConstraintMatch {
  id: string;
  type: string;
  title: string | null;
  severity: string | null;
  statement: string | null;
  direct: boolean;
  via_targets: Set<string>;
  via_layers: Set<string>;
  origins: Set<'direct' | 'layer'>;
  precedence_distance: number;
}

interface LayerGuidance {
  decisionIds: Set<string>;
  constrainingMatches: Map<string, InternalConstraintMatch>;
}

interface PropagatedDecision {
  id: string;
  type: string;
  title: string | null;
  category: string | null;
  severity: string | null;
  statement: string | null;
  via_layers: string[];
  precedence_distance: number;
  origin: 'layer_contains' | 'layer_constrains' | 'layer_contains_and_constrains';
}

interface PropagationAmbiguity {
  category: string;
  decision_ids: string[];
  message: string;
}

interface EffectiveResolution {
  nodeId: string;
  containsAncestors: string[];
  constrainingNodes: Array<{
    id: string;
    type: string;
    title: string | null;
    severity: string | null;
    statement: string | null;
    direct: boolean;
    via_targets: string[];
    via_layers: string[];
    origin: 'direct' | 'layer_propagated' | 'direct_and_layer_propagated';
    precedence_distance: number;
  }>;
  layerDependencies: Array<{ id: string; type: 'layer'; title: string | null; distance: number; path: string[] }>;
  propagatedDecisions: PropagatedDecision[];
  ambiguities: PropagationAmbiguity[];
}

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

export function getGroupSubgraph(
  graph: LoadedGraph,
  groupId: string
): { group: SpecNode; children: SpecNode[] } {
  const group = graph.nodesById.get(groupId);
  if (!group) {
    throw new Error(`Grouping node not found: ${groupId}`);
  }

  if (!isGroupingType(group.type)) {
    throw new Error(`Node '${groupId}' is not a grouping node (feature or layer)`);
  }

  const visited = new Set<string>([groupId]);
  const queue = [...uniqueTargets(group.links?.contains)];
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
    for (const next of uniqueTargets(node.links?.contains)) {
      if (!visited.has(next)) {
        queue.push(next);
      }
    }
  }

  return { group, children };
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

  const { children } = getGroupSubgraph(graph, featureId);
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
    via_layers: string[];
    origin: 'direct' | 'layer_propagated' | 'direct_and_layer_propagated';
    precedence_distance: number;
  }>;
  propagated_decisions: Array<{
    id: string;
    type: string;
    title: string | null;
    category: string | null;
    severity: string | null;
    statement: string | null;
    via_layers: string[];
    precedence_distance: number;
    origin: 'layer_contains' | 'layer_constrains' | 'layer_contains_and_constrains';
  }>;
  layer_dependencies: Array<{ id: string; type: 'layer'; title: string | null; distance: number; path: string[] }>;
  ambiguity_errors: string[];
  warnings: string[];
  count: number;
} {
  const node = graph.nodesById.get(nodeId);
  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  const resolution = resolveEffectiveGuidance(graph, nodeId);
  const warnings = collectSeverityWarnings(resolution.constrainingNodes);

  return {
    node_id: nodeId,
    contains_ancestors: resolution.containsAncestors,
    constraining_nodes: resolution.constrainingNodes,
    propagated_decisions: resolution.propagatedDecisions,
    layer_dependencies: resolution.layerDependencies,
    ambiguity_errors: resolution.ambiguities.map((entry) => entry.message),
    warnings,
    count: resolution.constrainingNodes.length
  };
}

export function findLayerPropagationAmbiguities(
  graph: LoadedGraph
): Array<{ target_id: string; category: string; decision_ids: string[]; message: string }> {
  const indexes = buildGraphIndexes(graph);
  const results: Array<{ target_id: string; category: string; decision_ids: string[]; message: string }> = [];

  for (const nodeId of graph.nodesById.keys()) {
    const resolution = resolveEffectiveGuidance(graph, nodeId, indexes);
    for (const ambiguity of resolution.ambiguities) {
      results.push({
        target_id: nodeId,
        category: ambiguity.category,
        decision_ids: ambiguity.decision_ids,
        message: ambiguity.message
      });
    }
  }

  return results;
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
  dependency_nodes: Array<{ id: string; type: string | null; title: string | null; depth: number; scope: 'informational_only' }>;
  decisions: Array<{ id: string; type: string | null; title: string | null; depth: number; scope: 'informational_only' }>;
  policies: Array<{ id: string; type: string | null; title: string | null; depth: number; scope: 'informational_only' }>;
  effective_constraint_nodes: Array<{
    id: string;
    type: string;
    title: string | null;
    severity: string | null;
    statement: string | null;
    direct: boolean;
    via_targets: string[];
    via_layers: string[];
    origin: 'direct' | 'layer_propagated' | 'direct_and_layer_propagated';
    precedence_distance: number;
    applies_to: string[];
    scope: 'normative_effective';
  }>;
  effective_decisions: Array<{
    id: string;
    type: string;
    title: string | null;
    severity: string | null;
    statement: string | null;
    category: string | null;
    via_layers: string[];
    origin: 'constrains' | 'layer_contains' | 'layer_constrains' | 'layer_contains_and_constrains';
    precedence_distance: number;
    applies_to: string[];
    scope: 'normative_effective';
  }>;
  effective_policies: Array<{
    id: string;
    type: string;
    title: string | null;
    severity: string | null;
    statement: string | null;
    applies_to: string[];
    via_layers: string[];
    origin: 'direct' | 'layer_propagated' | 'direct_and_layer_propagated';
    precedence_distance: number;
    scope: 'normative_effective';
  }>;
  effective_layers: Array<{ id: string; type: 'layer'; title: string | null; distance: number; path: string[]; scope: 'normative_effective' }>;
  informational_dependency_context: {
    nodes: Array<{ id: string; type: string | null; title: string | null; depth: number }>;
    decisions: Array<{ id: string; type: string | null; title: string | null; depth: number }>;
    policies: Array<{ id: string; type: string | null; title: string | null; depth: number }>;
  };
  missing_dependencies: string[];
  warnings: string[];
  ambiguity_errors: string[];
  depends_on_edges: Array<{ source: string; target: string }>;
  count: {
    direct_dependencies: number;
    transitive_dependencies: number;
    effective_constraints: number;
    effective_decisions: number;
    effective_policies: number;
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

    const existingDepth = depthById.get(current.id);
    if (existingDepth !== undefined && current.depth >= existingDepth) {
      continue;
    }
    depthById.set(current.id, current.depth);

    const depNode = graph.nodesById.get(current.id);
    if (!depNode) {
      missing.add(current.id);
      continue;
    }

    visited.add(current.id);

    for (const next of uniqueTargets(depNode.links?.depends_on)) {
      dependsOnEdges.push({ source: depNode.id, target: next });
      queue.push({ id: next, depth: current.depth + 1 });
    }
  }

  const dependencyNodes = Array.from(visited)
    .map((id) => {
      const depNode = graph.nodesById.get(id);
      return {
        id,
        type: depNode ? String(depNode.type) : null,
        title: depNode && typeof depNode.title === 'string' ? depNode.title : null,
        depth: depthById.get(id) ?? 1,
        scope: 'informational_only' as const
      };
    })
    .sort((a, b) => (a.depth !== b.depth ? a.depth - b.depth : a.id.localeCompare(b.id)));

  const decisions = dependencyNodes.filter((entry) => entry.type === 'decision');
  const policies = dependencyNodes.filter((entry) => entry.type === 'policy');

  const effective = getEffectiveConstraints(graph, nodeId);
  const normativeIds = new Set<string>([
    ...effective.constraining_nodes.map((entry) => entry.id),
    ...effective.propagated_decisions.map((entry) => entry.id),
    ...effective.layer_dependencies.map((entry) => entry.id)
  ]);

  const informationalOnlyNodes = dependencyNodes
    .filter((entry) => !normativeIds.has(entry.id))
    .map((entry) => ({ id: entry.id, type: entry.type, title: entry.title, depth: entry.depth }));

  const informationalOnlyDecisions = informationalOnlyNodes.filter((entry) => entry.type === 'decision');
  const informationalOnlyPolicies = informationalOnlyNodes.filter((entry) => entry.type === 'policy');

  const effectiveConstraintNodes = effective.constraining_nodes.map((entry) => ({
    ...entry,
    applies_to: [nodeId],
    scope: 'normative_effective' as const
  }));

  type EffectiveDecisionEntry = {
    id: string;
    type: string;
    title: string | null;
    severity: string | null;
    statement: string | null;
    category: string | null;
    via_layers: string[];
    origin: 'constrains' | 'layer_contains' | 'layer_constrains' | 'layer_contains_and_constrains';
    precedence_distance: number;
    applies_to: string[];
    scope: 'normative_effective';
  };

  const effectiveDecisionsFromConstraints: EffectiveDecisionEntry[] = effectiveConstraintNodes
    .filter((entry) => entry.type === 'decision')
    .map((entry) => ({
      id: entry.id,
      type: entry.type,
      title: entry.title,
      severity: entry.severity,
      statement: entry.statement,
      category: decisionCategory(graph.nodesById.get(entry.id)),
      via_layers: entry.via_layers,
      origin: 'constrains' as const,
      precedence_distance: entry.precedence_distance,
      applies_to: entry.applies_to,
      scope: 'normative_effective' as const
    }));

  const effectivePropagatedDecisions: EffectiveDecisionEntry[] = effective.propagated_decisions.map((entry) => ({
    id: entry.id,
    type: entry.type,
    title: entry.title,
    severity: entry.severity,
    statement: entry.statement,
    category: entry.category,
    via_layers: entry.via_layers,
    origin: entry.origin,
    precedence_distance: entry.precedence_distance,
    applies_to: [nodeId],
    scope: 'normative_effective' as const
  }));

  const effectiveDecisionMap = new Map<string, EffectiveDecisionEntry>();
  for (const decision of [...effectiveDecisionsFromConstraints, ...effectivePropagatedDecisions]) {
    const existing = effectiveDecisionMap.get(decision.id);
    if (!existing) {
      effectiveDecisionMap.set(decision.id, decision);
      continue;
    }

    const mergedOrigins = new Set([existing.origin, decision.origin]);
    const mergedLayers = Array.from(new Set([...existing.via_layers, ...decision.via_layers])).sort();
    const mergedDistance = Math.min(existing.precedence_distance, decision.precedence_distance);

    effectiveDecisionMap.set(decision.id, {
      ...decision,
      origin: mergedOrigins.has('constrains')
        ? mergedOrigins.has('layer_contains_and_constrains')
          ? 'layer_contains_and_constrains'
          : mergedOrigins.has('layer_contains')
            ? 'layer_contains_and_constrains'
            : mergedOrigins.has('layer_constrains')
              ? 'layer_contains_and_constrains'
              : 'constrains'
        : mergedOrigins.has('layer_contains_and_constrains')
          ? 'layer_contains_and_constrains'
          : mergedOrigins.has('layer_contains')
            ? 'layer_contains'
            : 'layer_constrains',
      via_layers: mergedLayers,
      precedence_distance: mergedDistance
    });
  }

  const effectiveDecisions = Array.from(effectiveDecisionMap.values()).sort((a, b) => {
    if (a.precedence_distance !== b.precedence_distance) {
      return a.precedence_distance - b.precedence_distance;
    }
    return a.id.localeCompare(b.id);
  });

  const effectivePolicies = effectiveConstraintNodes
    .filter((entry) => entry.type === 'policy')
    .map((entry) => ({
      id: entry.id,
      type: entry.type,
      title: entry.title,
      severity: entry.severity,
      statement: entry.statement,
      applies_to: entry.applies_to,
      via_layers: entry.via_layers,
      origin: entry.origin,
      precedence_distance: entry.precedence_distance,
      scope: 'normative_effective' as const
    }))
    .sort((a, b) => {
      if (a.precedence_distance !== b.precedence_distance) {
        return a.precedence_distance - b.precedence_distance;
      }
      return a.id.localeCompare(b.id);
    });

  return {
    node_id: nodeId,
    direct_dependencies: directDependencies,
    dependency_nodes: dependencyNodes,
    decisions,
    policies,
    effective_constraint_nodes: effectiveConstraintNodes,
    effective_decisions: effectiveDecisions,
    effective_policies: effectivePolicies,
    effective_layers: effective.layer_dependencies.map((layer) => ({
      ...layer,
      scope: 'normative_effective' as const
    })),
    informational_dependency_context: {
      nodes: informationalOnlyNodes,
      decisions: informationalOnlyDecisions,
      policies: informationalOnlyPolicies
    },
    missing_dependencies: Array.from(missing).sort(),
    warnings: effective.warnings,
    ambiguity_errors: effective.ambiguity_errors,
    depends_on_edges: dependsOnEdges,
    count: {
      direct_dependencies: directDependencies.length,
      transitive_dependencies: dependencyNodes.length,
      effective_constraints: effectiveConstraintNodes.length,
      effective_decisions: effectiveDecisions.length,
      effective_policies: effectivePolicies.length
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
    layer_dependencies: string[];
    propagated_decisions: string[];
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
    add(dep.id, 'depends_on_informational');
  }

  for (const constraint of effectiveConstraints.constraining_nodes) {
    if (constraint.origin === 'layer_propagated' || constraint.origin === 'direct_and_layer_propagated') {
      add(constraint.id, 'layer_propagated_constraint');
    }
    add(constraint.id, constraint.direct ? 'constrains_direct' : 'constrains_inherited');
  }

  for (const layer of effectiveConstraints.layer_dependencies) {
    add(layer.id, 'layer_dependency');
  }

  for (const decision of effectiveConstraints.propagated_decisions) {
    add(decision.id, 'layer_propagated_decision');
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
      layer_dependencies: effectiveConstraints.layer_dependencies.map((entry) => entry.id),
      propagated_decisions: effectiveConstraints.propagated_decisions.map((entry) => entry.id),
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

function resolveEffectiveGuidance(graph: LoadedGraph, nodeId: string, indexes?: GraphIndexes): EffectiveResolution {
  const resolvedIndexes = indexes ?? buildGraphIndexes(graph);
  const directConstraints = resolveDirectConstrainingNodes(graph, nodeId, resolvedIndexes);
  const containsAncestors = Array.from(collectContainsAncestors(nodeId, resolvedIndexes.parentsByChild))
    .filter((id) => id !== nodeId)
    .sort();

  const layerDependenciesMap = resolveLayerDependencies(graph, nodeId, resolvedIndexes);
  const layerDependencies = Array.from(layerDependenciesMap.values())
    .map((entry) => {
      const layer = graph.nodesById.get(entry.id);
      return {
        id: entry.id,
        type: 'layer' as const,
        title: layer && typeof layer.title === 'string' ? layer.title : null,
        distance: entry.distance,
        path: entry.path
      };
    })
    .sort((a, b) => (a.distance !== b.distance ? a.distance - b.distance : a.id.localeCompare(b.id)));

  const propagatedConstraintMap = new Map<string, InternalConstraintMatch>();
  const propagatedDecisionLayers = new Map<string, Set<string>>();
  const decisionOrigins = new Map<string, Set<'layer_contains' | 'layer_constrains'>>();

  for (const layerDependency of layerDependencies) {
    const layerGuidance = resolveLayerGuidance(graph, layerDependency.id, resolvedIndexes);

    for (const decisionId of layerGuidance.decisionIds) {
      const layers = propagatedDecisionLayers.get(decisionId) ?? new Set<string>();
      layers.add(layerDependency.id);
      propagatedDecisionLayers.set(decisionId, layers);

      const origins = decisionOrigins.get(decisionId) ?? new Set<'layer_contains' | 'layer_constrains'>();
      origins.add('layer_contains');
      decisionOrigins.set(decisionId, origins);
    }

    for (const [constraintId, match] of layerGuidance.constrainingMatches.entries()) {
      const existing = propagatedConstraintMap.get(constraintId);
      if (!existing) {
        propagatedConstraintMap.set(constraintId, {
          ...cloneConstraintMatch(match),
          direct: false,
          via_layers: new Set([layerDependency.id]),
          origins: new Set(['layer']),
          precedence_distance: layerDependency.distance
        });
      } else {
        for (const via of match.via_targets) {
          existing.via_targets.add(via);
        }
        existing.via_layers.add(layerDependency.id);
        existing.origins.add('layer');
        existing.precedence_distance = Math.min(existing.precedence_distance, layerDependency.distance);
      }

      const constraintNode = graph.nodesById.get(constraintId);
      if (constraintNode?.type === 'decision') {
        const decisionLayers = propagatedDecisionLayers.get(constraintId) ?? new Set<string>();
        decisionLayers.add(layerDependency.id);
        propagatedDecisionLayers.set(constraintId, decisionLayers);

        const origins = decisionOrigins.get(constraintId) ?? new Set<'layer_contains' | 'layer_constrains'>();
        origins.add('layer_constrains');
        decisionOrigins.set(constraintId, origins);
      }
    }
  }

  const candidatePropagatedIds = new Set<string>([
    ...propagatedConstraintMap.keys(),
    ...propagatedDecisionLayers.keys()
  ]);

  const activePropagatedIds = pruneSupersededGuidance(graph, candidatePropagatedIds);

  for (const id of Array.from(propagatedConstraintMap.keys())) {
    if (!activePropagatedIds.has(id)) {
      propagatedConstraintMap.delete(id);
    }
  }

  for (const id of Array.from(propagatedDecisionLayers.keys())) {
    if (!activePropagatedIds.has(id)) {
      propagatedDecisionLayers.delete(id);
      decisionOrigins.delete(id);
    }
  }

  for (const [constraintId, propagated] of propagatedConstraintMap.entries()) {
    const existing = directConstraints.get(constraintId);
    if (!existing) {
      directConstraints.set(constraintId, propagated);
      continue;
    }

    for (const viaTarget of propagated.via_targets) {
      existing.via_targets.add(viaTarget);
    }

    for (const viaLayer of propagated.via_layers) {
      existing.via_layers.add(viaLayer);
    }

    existing.origins.add('layer');
    existing.precedence_distance = Math.min(existing.precedence_distance, propagated.precedence_distance);
  }

  const propagatedDecisions: PropagatedDecision[] = [];
  for (const [decisionId, layers] of propagatedDecisionLayers.entries()) {
    const decision = graph.nodesById.get(decisionId);
    if (!decision || decision.type !== 'decision') {
      continue;
    }

    const sortedLayers = Array.from(layers).sort((a, b) => {
      const depthA = layerDependenciesMap.get(a)?.distance ?? Number.POSITIVE_INFINITY;
      const depthB = layerDependenciesMap.get(b)?.distance ?? Number.POSITIVE_INFINITY;
      if (depthA !== depthB) {
        return depthA - depthB;
      }
      return a.localeCompare(b);
    });

    const precedenceDistance = sortedLayers
      .map((id) => layerDependenciesMap.get(id)?.distance ?? Number.POSITIVE_INFINITY)
      .reduce((min, value) => Math.min(min, value), Number.POSITIVE_INFINITY);

    const origins = decisionOrigins.get(decisionId) ?? new Set<'layer_contains' | 'layer_constrains'>();

    propagatedDecisions.push({
      id: decisionId,
      type: 'decision',
      title: typeof decision.title === 'string' ? decision.title : null,
      category: decisionCategory(decision),
      severity: typeof decision.severity === 'string' ? decision.severity : null,
      statement: typeof decision.statement === 'string' ? decision.statement : null,
      via_layers: sortedLayers,
      precedence_distance: Number.isFinite(precedenceDistance) ? precedenceDistance : 0,
      origin: determineDecisionOrigin(origins)
    });
  }

  propagatedDecisions.sort((a, b) => {
    if (a.precedence_distance !== b.precedence_distance) {
      return a.precedence_distance - b.precedence_distance;
    }
    return a.id.localeCompare(b.id);
  });

  const ambiguities = resolvePropagationAmbiguities(nodeId, propagatedDecisions);

  const constrainingNodes = Array.from(directConstraints.values())
    .map((entry) => ({
      id: entry.id,
      type: entry.type,
      title: entry.title,
      severity: entry.severity,
      statement: entry.statement,
      direct: entry.direct,
      via_targets: Array.from(entry.via_targets).sort(),
      via_layers: Array.from(entry.via_layers).sort((a, b) => {
        const depthA = layerDependenciesMap.get(a)?.distance ?? Number.POSITIVE_INFINITY;
        const depthB = layerDependenciesMap.get(b)?.distance ?? Number.POSITIVE_INFINITY;
        if (depthA !== depthB) {
          return depthA - depthB;
        }
        return a.localeCompare(b);
      }),
      origin: determineConstraintOrigin(entry.origins),
      precedence_distance: entry.precedence_distance
    }))
    .sort((a, b) => {
      if (a.precedence_distance !== b.precedence_distance) {
        return a.precedence_distance - b.precedence_distance;
      }
      return a.id.localeCompare(b.id);
    });

  return {
    nodeId,
    containsAncestors,
    constrainingNodes,
    layerDependencies,
    propagatedDecisions,
    ambiguities
  };
}

function buildGraphIndexes(graph: LoadedGraph): GraphIndexes {
  const containsByParent = new Map<string, string[]>();
  const parentsByChild = new Map<string, string[]>();

  for (const node of graph.nodesById.values()) {
    const children = uniqueTargets(node.links?.contains);
    if (children.length > 0) {
      containsByParent.set(node.id, children);
    }

    for (const childId of children) {
      const parents = parentsByChild.get(childId) ?? [];
      parents.push(node.id);
      parentsByChild.set(childId, parents);
    }
  }

  return { containsByParent, parentsByChild };
}

function collectContainsAncestors(nodeId: string, parentsByChild: Map<string, string[]>): Set<string> {
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

  return ancestry;
}

function collectContainsClosure(rootId: string, containsByParent: Map<string, string[]>): Set<string> {
  const closure = new Set<string>([rootId]);
  const queue = [rootId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    for (const childId of containsByParent.get(current) ?? []) {
      if (closure.has(childId)) {
        continue;
      }
      closure.add(childId);
      queue.push(childId);
    }
  }

  return closure;
}

function resolveDirectConstrainingNodes(
  graph: LoadedGraph,
  nodeId: string,
  indexes: GraphIndexes
): Map<string, InternalConstraintMatch> {
  const ancestry = collectContainsAncestors(nodeId, indexes.parentsByChild);
  const matches = new Map<string, InternalConstraintMatch>();

  for (const sourceNode of graph.nodesById.values()) {
    const targets = uniqueTargets(sourceNode.links?.constrains);
    if (targets.length === 0) {
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
        via_targets: new Set(matchedTargets),
        via_layers: new Set<string>(),
        origins: new Set(['direct']),
        precedence_distance: 0
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

  return matches;
}

function resolveLayerDependencies(
  graph: LoadedGraph,
  nodeId: string,
  indexes: GraphIndexes
): Map<string, LayerDependency> {
  const distanceByNode = new Map<string, number>([[nodeId, 0]]);
  const previousNode = new Map<string, string | null>([[nodeId, null]]);
  const queue: Array<{ id: string; distance: number }> = [{ id: nodeId, distance: 0 }];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    const currentNode = graph.nodesById.get(current.id);
    if (!currentNode) {
      continue;
    }

    const neighbors = new Set<string>(uniqueTargets(currentNode.links?.depends_on));
    for (const parentId of indexes.parentsByChild.get(current.id) ?? []) {
      const parentNode = graph.nodesById.get(parentId);
      if (parentNode && isGroupingType(parentNode.type)) {
        neighbors.add(parentId);
      }
    }

    for (const neighborId of neighbors) {
      const nextDistance = current.distance + 1;
      const existingDistance = distanceByNode.get(neighborId);
      if (existingDistance !== undefined && existingDistance <= nextDistance) {
        continue;
      }

      distanceByNode.set(neighborId, nextDistance);
      previousNode.set(neighborId, current.id);
      queue.push({ id: neighborId, distance: nextDistance });
    }
  }

  const layers = new Map<string, LayerDependency>();
  for (const [candidateId, distance] of distanceByNode.entries()) {
    if (candidateId === nodeId) {
      continue;
    }

    const candidate = graph.nodesById.get(candidateId);
    if (!candidate || candidate.type !== 'layer') {
      continue;
    }

    const path = reconstructPath(previousNode, nodeId, candidateId);
    layers.set(candidateId, {
      id: candidateId,
      distance,
      path
    });
  }

  return layers;
}

function reconstructPath(previousNode: Map<string, string | null>, startId: string, endId: string): string[] {
  const path: string[] = [endId];
  let cursor: string | null = endId;

  while (cursor && cursor !== startId) {
    cursor = previousNode.get(cursor) ?? null;
    if (!cursor) {
      break;
    }
    path.push(cursor);
  }

  if (path[path.length - 1] !== startId) {
    return [startId, endId];
  }

  path.reverse();
  return path;
}

function resolveLayerGuidance(graph: LoadedGraph, layerId: string, indexes: GraphIndexes): LayerGuidance {
  const closure = collectContainsClosure(layerId, indexes.containsByParent);
  const decisionIds = new Set<string>();
  const constrainingMatches = new Map<string, InternalConstraintMatch>();

  for (const closureNodeId of closure) {
    const closureNode = graph.nodesById.get(closureNodeId);
    if (closureNode?.type === 'decision') {
      decisionIds.add(closureNode.id);
    }

    const directMatches = resolveDirectConstrainingNodes(graph, closureNodeId, indexes);
    for (const [matchId, match] of directMatches.entries()) {
      const existing = constrainingMatches.get(matchId);
      if (!existing) {
        constrainingMatches.set(matchId, {
          ...cloneConstraintMatch(match),
          direct: false,
          via_layers: new Set<string>(),
          origins: new Set<'direct' | 'layer'>(),
          precedence_distance: Number.POSITIVE_INFINITY
        });
      } else {
        for (const viaTarget of match.via_targets) {
          existing.via_targets.add(viaTarget);
        }
      }
    }
  }

  return { decisionIds, constrainingMatches };
}

function cloneConstraintMatch(match: InternalConstraintMatch): InternalConstraintMatch {
  return {
    id: match.id,
    type: match.type,
    title: match.title,
    severity: match.severity,
    statement: match.statement,
    direct: match.direct,
    via_targets: new Set(match.via_targets),
    via_layers: new Set(match.via_layers),
    origins: new Set(match.origins),
    precedence_distance: match.precedence_distance
  };
}

function pruneSupersededGuidance(graph: LoadedGraph, candidateIds: Set<string>): Set<string> {
  const active = new Set(candidateIds);
  const superseded = new Set<string>();

  const closureCache = new Map<string, Set<string>>();
  const supersedesClosure = (sourceId: string): Set<string> => {
    const cached = closureCache.get(sourceId);
    if (cached) {
      return cached;
    }

    const closure = new Set<string>();
    const visited = new Set<string>([sourceId]);
    const queue = [sourceId];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {
        continue;
      }

      const node = graph.nodesById.get(current);
      if (!node) {
        continue;
      }

      for (const target of uniqueTargets(node.links?.supersedes)) {
        if (visited.has(target)) {
          continue;
        }

        visited.add(target);
        closure.add(target);
        queue.push(target);
      }
    }

    closureCache.set(sourceId, closure);
    return closure;
  };

  for (const sourceId of active) {
    const closure = supersedesClosure(sourceId);
    for (const targetId of closure) {
      if (targetId !== sourceId && active.has(targetId)) {
        superseded.add(targetId);
      }
    }
  }

  for (const id of superseded) {
    active.delete(id);
  }

  return active;
}

function resolvePropagationAmbiguities(nodeId: string, propagatedDecisions: PropagatedDecision[]): PropagationAmbiguity[] {
  const byCategory = new Map<string, string[]>();

  for (const decision of propagatedDecisions) {
    if (!decision.category) {
      continue;
    }

    const bucket = byCategory.get(decision.category) ?? [];
    bucket.push(decision.id);
    byCategory.set(decision.category, bucket);
  }

  const ambiguities: PropagationAmbiguity[] = [];
  for (const [category, decisionIds] of byCategory.entries()) {
    if (decisionIds.length <= 1) {
      continue;
    }

    const sortedIds = Array.from(new Set(decisionIds)).sort();
    ambiguities.push({
      category,
      decision_ids: sortedIds,
      message: `Ambiguous propagated decisions for '${nodeId}' in category '${category}': disambiguate with supersedes and/or dependency structure`
    });
  }

  ambiguities.sort((a, b) => a.category.localeCompare(b.category));
  return ambiguities;
}

function determineConstraintOrigin(
  origins: Set<'direct' | 'layer'>
): 'direct' | 'layer_propagated' | 'direct_and_layer_propagated' {
  if (origins.has('direct') && origins.has('layer')) {
    return 'direct_and_layer_propagated';
  }
  if (origins.has('layer')) {
    return 'layer_propagated';
  }
  return 'direct';
}

function determineDecisionOrigin(
  origins: Set<'layer_contains' | 'layer_constrains'>
): 'layer_contains' | 'layer_constrains' | 'layer_contains_and_constrains' {
  if (origins.has('layer_contains') && origins.has('layer_constrains')) {
    return 'layer_contains_and_constrains';
  }
  if (origins.has('layer_contains')) {
    return 'layer_contains';
  }
  return 'layer_constrains';
}

function decisionCategory(node: SpecNode | undefined): string | null {
  if (!node || node.type !== 'decision') {
    return null;
  }

  return typeof node.category === 'string' ? node.category : null;
}

function isGroupingType(nodeType: unknown): boolean {
  return nodeType === 'feature' || nodeType === 'layer';
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
