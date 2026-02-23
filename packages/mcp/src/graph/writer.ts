import { access, mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import { DEFAULT_DIRECTORY, DEFAULT_SPECGRAPH_VERSION, EDGE_TYPES, NODE_TYPE_DIRS } from '../constants.js';
import { writeJson, resolveInside } from '../json.js';
import type { EdgeType, GraphIndex, LoadedGraph, OperationResult, SpecNode } from '../types.js';
import { invalidateGraphCache, loadGraph } from './loader.js';
import { getSchemaValidators } from './schema.js';

const FEATURE_SCHEMA_URL = 'https://oco-adam.github.io/specgraph/schemas/node.schema.json';
const GRAPH_SCHEMA_URL = 'https://oco-adam.github.io/specgraph/schemas/graph.schema.json';

interface RootFeatureInput {
  id: string;
  title: string;
  description: string;
}

export async function addNode(
  repoDir: string,
  directory: string,
  node: SpecNode
): Promise<OperationResult> {
  assertNodeShape(node);

  const graph = await loadGraph(repoDir, directory, { forceReload: true });

  if (graph.nodesById.has(node.id)) {
    throw new Error(`Node already exists: ${node.id}`);
  }

  await validateNodeOrThrow(node);

  const relPath = nodePathFor(node.id, node.type);
  if (graph.index.nodes.some((ref) => ref.path === relPath)) {
    throw new Error(`Node path already referenced by graph: ${relPath}`);
  }

  const absPath = resolveInside(graph.graphDir, relPath);
  await ensureNotExists(absPath);

  await mkdir(path.dirname(absPath), { recursive: true });
  await writeJson(absPath, withNodeSchema(node));

  graph.index.nodes.push({
    id: node.id,
    path: relPath,
    expectedType: node.type
  });
  graph.index.nodes.sort((a, b) => a.id.localeCompare(b.id));

  await writeGraphIndex(graph);
  invalidateGraphCache(repoDir, directory);

  return {
    success: true,
    operation: 'add_node',
    node_id: node.id,
    files_changed: [relToRepo(graph, absPath), relToRepo(graph, graph.graphPath)]
  };
}

export async function updateNode(
  repoDir: string,
  directory: string,
  node: SpecNode
): Promise<OperationResult> {
  assertNodeShape(node);

  const graph = await loadGraph(repoDir, directory, { forceReload: true });
  const ref = graph.refsById.get(node.id);
  if (!ref) {
    throw new Error(`Node does not exist: ${node.id}`);
  }

  await validateNodeOrThrow(node);

  const oldAbsPath = resolveInside(graph.graphDir, ref.path);
  const newRelPath = nodePathFor(node.id, node.type);
  const newAbsPath = resolveInside(graph.graphDir, newRelPath);

  const filesChanged: string[] = [];

  if (newRelPath !== ref.path) {
    const conflicting = graph.index.nodes.find((candidate) => candidate.path === newRelPath && candidate.id !== node.id);
    if (conflicting) {
      throw new Error(`Cannot move node to ${newRelPath}: path is used by ${conflicting.id}`);
    }
  }

  await mkdir(path.dirname(newAbsPath), { recursive: true });
  await writeJson(newAbsPath, withNodeSchema(node));
  filesChanged.push(relToRepo(graph, newAbsPath));

  if (newAbsPath !== oldAbsPath) {
    await unlinkIfExists(oldAbsPath);
    filesChanged.push(relToRepo(graph, oldAbsPath));
    ref.path = newRelPath;
  }

  if (ref.expectedType !== node.type) {
    ref.expectedType = node.type;
  }

  await writeGraphIndex(graph);
  filesChanged.push(relToRepo(graph, graph.graphPath));

  invalidateGraphCache(repoDir, directory);

  return {
    success: true,
    operation: 'update_node',
    node_id: node.id,
    files_changed: unique(filesChanged)
  };
}

export async function removeNode(
  repoDir: string,
  directory: string,
  nodeId: string
): Promise<OperationResult> {
  const graph = await loadGraph(repoDir, directory, { forceReload: true });
  const ref = graph.refsById.get(nodeId);
  if (!ref) {
    throw new Error(`Node does not exist: ${nodeId}`);
  }

  const filesChanged: string[] = [];

  graph.index.nodes = graph.index.nodes.filter((entry) => entry.id !== nodeId);
  if (graph.index.root === nodeId) {
    delete graph.index.root;
  }

  const targetAbsPath = resolveInside(graph.graphDir, ref.path);
  await unlinkIfExists(targetAbsPath);
  filesChanged.push(relToRepo(graph, targetAbsPath));

  for (const [id, node] of graph.nodesById.entries()) {
    if (id === nodeId) {
      continue;
    }

    const changed = scrubNodeLinks(node, nodeId);
    if (!changed) {
      continue;
    }

    const nodeRef = graph.refsById.get(id);
    if (!nodeRef) {
      continue;
    }

    const nodePath = resolveInside(graph.graphDir, nodeRef.path);
    await writeJson(nodePath, withNodeSchema(node));
    filesChanged.push(relToRepo(graph, nodePath));
  }

  await writeGraphIndex(graph);
  filesChanged.push(relToRepo(graph, graph.graphPath));

  const orphanFiles = await cleanupOrphanNodeFiles(graph);
  for (const orphan of orphanFiles) {
    filesChanged.push(relToRepo(graph, orphan));
  }

  invalidateGraphCache(repoDir, directory);

  return {
    success: true,
    operation: 'remove_node',
    node_id: nodeId,
    files_changed: unique(filesChanged)
  };
}

export async function addEdge(
  repoDir: string,
  directory: string,
  source: string,
  target: string,
  edgeType: EdgeType
): Promise<OperationResult> {
  assertEdgeType(edgeType);

  if (source === target) {
    throw new Error('Self-references are not allowed');
  }

  const graph = await loadGraph(repoDir, directory, { forceReload: true });
  const sourceNode = graph.nodesById.get(source);
  if (!sourceNode) {
    throw new Error(`Source node not found: ${source}`);
  }

  if (!graph.nodesById.has(target)) {
    throw new Error(`Target node not found: ${target}`);
  }

  const links = normalizeLinks(sourceNode);
  const targets = Array.isArray(links[edgeType]) ? [...links[edgeType]!].filter((entry) => typeof entry === 'string') : [];

  if (targets.includes(target)) {
    return {
      success: true,
      operation: 'add_edge',
      files_changed: []
    };
  }

  targets.push(target);
  links[edgeType] = targets;

  await validateNodeOrThrow(sourceNode);

  const sourceRef = graph.refsById.get(source);
  if (!sourceRef) {
    throw new Error(`Missing source reference for node: ${source}`);
  }

  const sourcePath = resolveInside(graph.graphDir, sourceRef.path);
  await writeJson(sourcePath, withNodeSchema(sourceNode));

  invalidateGraphCache(repoDir, directory);

  return {
    success: true,
    operation: 'add_edge',
    files_changed: [relToRepo(graph, sourcePath)]
  };
}

export async function removeEdge(
  repoDir: string,
  directory: string,
  source: string,
  target: string,
  edgeType: EdgeType
): Promise<OperationResult> {
  assertEdgeType(edgeType);

  const graph = await loadGraph(repoDir, directory, { forceReload: true });
  const sourceNode = graph.nodesById.get(source);
  if (!sourceNode) {
    throw new Error(`Source node not found: ${source}`);
  }

  const links = normalizeLinks(sourceNode);
  const targets = Array.isArray(links[edgeType]) ? [...links[edgeType]!].filter((entry) => typeof entry === 'string') : [];
  const nextTargets = targets.filter((value) => value !== target);

  if (nextTargets.length === targets.length) {
    return {
      success: true,
      operation: 'remove_edge',
      files_changed: []
    };
  }

  if (nextTargets.length === 0) {
    delete links[edgeType];
  } else {
    links[edgeType] = nextTargets;
  }

  cleanupEmptyLinks(sourceNode);

  await validateNodeOrThrow(sourceNode);

  const sourceRef = graph.refsById.get(source);
  if (!sourceRef) {
    throw new Error(`Missing source reference for node: ${source}`);
  }

  const sourcePath = resolveInside(graph.graphDir, sourceRef.path);
  await writeJson(sourcePath, withNodeSchema(sourceNode));

  invalidateGraphCache(repoDir, directory);

  return {
    success: true,
    operation: 'remove_edge',
    files_changed: [relToRepo(graph, sourcePath)]
  };
}

export async function initSpecgraph(
  repoDir: string,
  options: {
    directory?: string;
    specgraphVersion?: string;
    rootFeature?: RootFeatureInput;
  }
): Promise<OperationResult> {
  const directory = options.directory ?? DEFAULT_DIRECTORY;
  const graphDir = path.resolve(repoDir, directory);
  const graphPath = path.join(graphDir, 'graph.json');

  await ensureNotExists(graphPath);

  const rootFeature: RootFeatureInput = options.rootFeature ?? {
    id: 'ROOT',
    title: 'Root Feature',
    description: 'Top-level feature for this spec graph.'
  };

  const featureNode: SpecNode = {
    $schema: FEATURE_SCHEMA_URL,
    id: rootFeature.id,
    type: 'feature',
    title: rootFeature.title,
    description: rootFeature.description
  };

  const featurePath = nodePathFor(featureNode.id, featureNode.type);

  const index: GraphIndex = {
    $schema: GRAPH_SCHEMA_URL,
    specgraphVersion: options.specgraphVersion ?? DEFAULT_SPECGRAPH_VERSION,
    root: rootFeature.id,
    nodes: [
      {
        id: rootFeature.id,
        path: featurePath,
        expectedType: 'feature'
      }
    ]
  };

  const validators = await getSchemaValidators();

  if (!validators.validateNode(featureNode)) {
    throw new Error(`Invalid root feature node: ${JSON.stringify(validators.validateNode.errors)}`);
  }

  if (!validators.validateGraph(index)) {
    throw new Error(`Invalid graph index: ${JSON.stringify(validators.validateGraph.errors)}`);
  }

  const featureAbsPath = resolveInside(graphDir, featurePath);
  await mkdir(path.dirname(featureAbsPath), { recursive: true });
  await writeJson(featureAbsPath, featureNode);
  await writeJson(graphPath, index);

  invalidateGraphCache(repoDir, directory);

  return {
    success: true,
    operation: 'init_specgraph',
    node_id: rootFeature.id,
    files_changed: [
      toRepoPath(path.resolve(repoDir), featureAbsPath),
      toRepoPath(path.resolve(repoDir), graphPath)
    ]
  };
}

function scrubNodeLinks(node: SpecNode, targetId: string): boolean {
  const links = node.links;
  if (!links || typeof links !== 'object') {
    return false;
  }

  let changed = false;

  for (const edgeType of EDGE_TYPES) {
    const targets = links[edgeType];
    if (!Array.isArray(targets)) {
      continue;
    }

    const next = targets.filter((id) => id !== targetId);
    if (next.length !== targets.length) {
      changed = true;
      if (next.length === 0) {
        delete links[edgeType];
      } else {
        links[edgeType] = next;
      }
    }
  }

  cleanupEmptyLinks(node);
  return changed;
}

function cleanupEmptyLinks(node: SpecNode): void {
  const links = node.links;
  if (!links || typeof links !== 'object') {
    return;
  }

  const hasEdges = EDGE_TYPES.some((type) => Array.isArray(links[type]) && links[type]!.length > 0);
  if (!hasEdges) {
    delete node.links;
  }
}

async function cleanupOrphanNodeFiles(graph: LoadedGraph): Promise<string[]> {
  const referenced = new Set(graph.index.nodes.map((ref) => ref.path));
  const nodeFiles = await fg('nodes/**/*.json', {
    cwd: graph.graphDir,
    onlyFiles: true
  });

  const removed: string[] = [];
  for (const relPath of nodeFiles) {
    if (referenced.has(relPath)) {
      continue;
    }

    const absPath = resolveInside(graph.graphDir, relPath);
    await unlinkIfExists(absPath);
    removed.push(absPath);
  }

  return removed;
}

async function validateNodeOrThrow(node: SpecNode): Promise<void> {
  const validators = await getSchemaValidators();
  const valid = validators.validateNode(node);
  if (!valid) {
    throw new Error(`Node schema validation failed: ${JSON.stringify(validators.validateNode.errors)}`);
  }
}

function assertNodeShape(node: SpecNode): void {
  if (!node || typeof node !== 'object') {
    throw new Error('node must be an object');
  }

  if (typeof node.id !== 'string' || node.id.length === 0) {
    throw new Error('node.id must be a non-empty string');
  }

  if (typeof node.type !== 'string' || node.type.length === 0) {
    throw new Error('node.type must be a non-empty string');
  }
}

function assertEdgeType(edgeType: string): asserts edgeType is EdgeType {
  if (!EDGE_TYPES.includes(edgeType as EdgeType)) {
    throw new Error(`Invalid edge type: ${edgeType}`);
  }
}

function nodePathFor(nodeId: string, nodeType: string): string {
  const dir = NODE_TYPE_DIRS[nodeType];
  if (!dir) {
    throw new Error(`Unsupported node type: ${nodeType}`);
  }

  return path.posix.join('nodes', dir, `${nodeId}.json`);
}

function normalizeLinks(node: SpecNode): Record<string, string[]> {
  if (!node.links || typeof node.links !== 'object' || Array.isArray(node.links)) {
    node.links = {};
  }

  return node.links as Record<string, string[]>;
}

function withNodeSchema(node: SpecNode): SpecNode {
  if (typeof node.$schema === 'string') {
    return node;
  }

  return {
    ...node,
    $schema: FEATURE_SCHEMA_URL
  };
}

async function writeGraphIndex(graph: LoadedGraph): Promise<void> {
  graph.index.nodes.sort((a, b) => a.id.localeCompare(b.id));
  await writeJson(graph.graphPath, graph.index);
}

async function ensureNotExists(filePath: string): Promise<void> {
  try {
    await access(filePath);
    throw new Error(`Path already exists: ${filePath}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return;
    }

    throw error;
  }
}

async function unlinkIfExists(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

function relToRepo(graph: LoadedGraph, absPath: string): string {
  return toRepoPath(graph.repoDir, absPath);
}

function toRepoPath(repoDir: string, absPath: string): string {
  const rel = path.relative(repoDir, absPath);
  return rel.split(path.sep).join('/');
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}
