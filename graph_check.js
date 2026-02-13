#!/usr/bin/env node

/**
 * Graph Integrity Checker
 *
 * Complements validate.js (schema validation) by validating graph-level semantics:
 * - Unique node IDs in graph.json
 * - Node refs resolve to files; ref.id matches node.id; expectedType matches node.type
 * - All link targets exist (referential integrity)
 * - No self-references in links
 * - depends_on is acyclic (cycle detection with path output)
 * - Optional pin verification for derived nodes ("derived_from" + "pins")
 * - Optional tamper detection (graph.json nodeRef.sha256 compared to file hash)
 *
 * Usage:
 *   node graph_check.js
 *   node graph_check.js --graph website/static/examples/auth/graph.json
 *   node graph_check.js --examples-dir website/static/examples
 *   node graph_check.js --strict
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DEFAULT_EXAMPLES_DIR = path.join(__dirname, 'website', 'static', 'examples');
const EDGE_TYPES = [
  'contains',
  'depends_on',
  'constrains',
  'implements',
  'derived_from',
  'verified_by',
  'supersedes',
];

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function sha256File(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

function listExampleGraphPaths(examplesDir) {
  if (!fs.existsSync(examplesDir)) return [];
  const dirs = fs
    .readdirSync(examplesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const graphPaths = [];
  for (const dirName of dirs) {
    const candidate = path.join(examplesDir, dirName, 'graph.json');
    if (fs.existsSync(candidate)) graphPaths.push(candidate);
  }
  return graphPaths;
}

function formatRef(graphDir, filePath) {
  const rel = path.relative(graphDir, filePath);
  return rel.startsWith('..') ? filePath : rel;
}

function detectDependsOnCycle(idToDeps) {
  const visiting = new Set();
  const visited = new Set();
  const stack = [];

  function dfs(nodeId) {
    if (visited.has(nodeId)) return null;
    if (visiting.has(nodeId)) {
      const idx = stack.indexOf(nodeId);
      const cycle = idx >= 0 ? stack.slice(idx).concat(nodeId) : [nodeId, nodeId];
      return cycle;
    }

    visiting.add(nodeId);
    stack.push(nodeId);

    const deps = idToDeps.get(nodeId) || [];
    for (const dep of deps) {
      const cycle = dfs(dep);
      if (cycle) return cycle;
    }

    stack.pop();
    visiting.delete(nodeId);
    visited.add(nodeId);
    return null;
  }

  for (const nodeId of idToDeps.keys()) {
    const cycle = dfs(nodeId);
    if (cycle) return cycle;
  }
  return null;
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function checkGraph(graphPath, opts) {
  const graphDir = path.dirname(graphPath);
  const graph = loadJson(graphPath);

  const errors = [];
  const warnings = [];

  const nodeRefs = Array.isArray(graph.nodes) ? graph.nodes : [];
  const idToRef = new Map();

  for (const ref of nodeRefs) {
    if (!ref || typeof ref !== 'object') {
      errors.push(`Invalid node ref entry (expected object): ${JSON.stringify(ref)}`);
      continue;
    }

    const id = ref.id;
    const p = ref.path;
    if (typeof id !== 'string' || id.length === 0) {
      errors.push(`Invalid node ref id: ${JSON.stringify(ref)}`);
      continue;
    }
    if (idToRef.has(id)) {
      errors.push(`Duplicate node id in graph.json: ${id}`);
      continue;
    }
    if (typeof p !== 'string' || p.length === 0) {
      errors.push(`Missing/invalid path for node ref ${id}`);
      continue;
    }
    idToRef.set(id, ref);
  }

  if (typeof graph.root === 'string' && graph.root.length > 0) {
    if (!idToRef.has(graph.root)) {
      errors.push(`graph.root references missing node: ${graph.root}`);
    }
  }

  const idToNode = new Map();
  const idToNodePath = new Map();
  const idToNodeFileSha = new Map();

  for (const [id, ref] of idToRef.entries()) {
    const absNodePath = path.resolve(graphDir, ref.path);
    idToNodePath.set(id, absNodePath);

    if (!fs.existsSync(absNodePath)) {
      errors.push(`Missing node file for ${id}: ${formatRef(graphDir, absNodePath)}`);
      continue;
    }

    let node;
    try {
      node = loadJson(absNodePath);
    } catch (e) {
      errors.push(`Failed to parse JSON for ${id}: ${formatRef(graphDir, absNodePath)} (${String(e)})`);
      continue;
    }

    if (!node || typeof node !== 'object') {
      errors.push(`Node file is not an object for ${id}: ${formatRef(graphDir, absNodePath)}`);
      continue;
    }

    if (node.id !== id) {
      errors.push(`graph.json id (${id}) does not match node.id (${node.id}) in ${formatRef(graphDir, absNodePath)}`);
    }

    if (typeof ref.expectedType === 'string' && ref.expectedType.length > 0) {
      if (node.type !== ref.expectedType) {
        errors.push(
          `expectedType mismatch for ${id}: graph.json=${ref.expectedType}, node.type=${node.type} (${formatRef(graphDir, absNodePath)})`
        );
      }
    }

    // Optional tamper detection when graph.json provides sha256.
    if (typeof ref.sha256 === 'string' && ref.sha256.length > 0) {
      const actual = sha256File(absNodePath);
      idToNodeFileSha.set(id, actual);
      if (actual.toLowerCase() !== ref.sha256.toLowerCase()) {
        errors.push(
          `sha256 mismatch for ${id}: graph.json=${ref.sha256}, file=${actual} (${formatRef(graphDir, absNodePath)})`
        );
      }
    } else {
      // Still compute for internal pin checking.
      idToNodeFileSha.set(id, sha256File(absNodePath));
    }

    idToNode.set(id, node);
  }

  // Referential integrity + self-reference checks.
  const idToDeps = new Map();
  for (const [fromId, node] of idToNode.entries()) {
    const links = node.links;
    if (links === undefined) continue;
    if (!isObject(links)) {
      errors.push(`links must be an object for ${fromId}`);
      continue;
    }

    for (const edgeType of EDGE_TYPES) {
      if (links[edgeType] === undefined) continue;

      const targets = links[edgeType];
      if (!Array.isArray(targets)) {
        errors.push(`links.${edgeType} must be an array for ${fromId}`);
        continue;
      }

      for (const toId of targets) {
        if (typeof toId !== 'string' || toId.length === 0) {
          errors.push(`Invalid link target in ${fromId}.links.${edgeType}: ${JSON.stringify(toId)}`);
          continue;
        }
        if (toId === fromId) {
          errors.push(`Self-reference not allowed: ${fromId}.links.${edgeType} contains ${toId}`);
          continue;
        }
        if (!idToNode.has(toId)) {
          errors.push(`Missing link target: ${fromId}.links.${edgeType} -> ${toId}`);
        }
      }

      if (edgeType === 'depends_on') {
        idToDeps.set(fromId, targets.slice());
      }
    }
  }

  // depends_on acyclicity.
  const cycle = detectDependsOnCycle(idToDeps);
  if (cycle) {
    errors.push(`depends_on cycle detected: ${cycle.join(' -> ')}`);
  }

  // derived_from pin checks (best-effort; strict mode tightens).
  for (const [nodeId, node] of idToNode.entries()) {
    const derivedFrom = node?.links?.derived_from;
    if (!Array.isArray(derivedFrom) || derivedFrom.length === 0) continue;

    const pins = Array.isArray(node.pins) ? node.pins : [];
    const pinMap = new Map();
    for (const pin of pins) {
      if (!pin || typeof pin !== 'object') continue;
      if (typeof pin.id === 'string' && typeof pin.sha256 === 'string') {
        pinMap.set(pin.id, pin.sha256);
      }
    }

    for (const sourceId of derivedFrom) {
      const pinned = pinMap.get(sourceId);
      if (!pinned) {
        const msg = `${nodeId} has derived_from ${sourceId} but is missing a matching pins entry`;
        if (opts.strict) errors.push(msg);
        else warnings.push(msg);
        continue;
      }

      const sourceNode = idToNode.get(sourceId);
      if (!sourceNode) continue;

      let expected;
      if (sourceNode.type === 'artifact' && sourceNode.artifact && typeof sourceNode.artifact.sha256 === 'string') {
        expected = sourceNode.artifact.sha256;
      } else {
        expected = idToNodeFileSha.get(sourceId);
      }

      if (expected && expected.toLowerCase() !== String(pinned).toLowerCase()) {
        errors.push(
          `${nodeId} pins ${sourceId} at ${pinned} but current source hash is ${expected}`
        );
      }
    }
  }

  return { errors, warnings };
}

function parseArgs(argv) {
  const args = { graph: null, examplesDir: null, strict: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--strict') args.strict = true;
    else if (a === '--graph' && i + 1 < argv.length) args.graph = argv[++i];
    else if (a.startsWith('--graph=')) args.graph = a.slice('--graph='.length);
    else if (a === '--examples-dir' && i + 1 < argv.length) args.examplesDir = argv[++i];
    else if (a.startsWith('--examples-dir=')) args.examplesDir = a.slice('--examples-dir='.length);
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const strict = args.strict;

  const graphPaths = [];
  if (args.graph) {
    graphPaths.push(path.resolve(process.cwd(), args.graph));
  } else {
    const dir = path.resolve(process.cwd(), args.examplesDir || DEFAULT_EXAMPLES_DIR);
    graphPaths.push(...listExampleGraphPaths(dir));
  }

  if (graphPaths.length === 0) {
    console.error('No graph.json files found to check.');
    process.exit(1);
  }

  let totalGraphs = 0;
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const graphPath of graphPaths) {
    totalGraphs++;
    const graphDir = path.dirname(graphPath);
    const label = path.basename(graphDir);

    console.log(`\n--- Graph Check: ${label} ---`);

    let result;
    try {
      result = checkGraph(graphPath, { strict });
    } catch (e) {
      totalErrors++;
      console.error(`  FAIL  ${graphPath}`);
      console.error(`        Checker crashed: ${String(e)}`);
      continue;
    }

    if (result.errors.length === 0 && result.warnings.length === 0) {
      console.log(`  PASS  ${formatRef(graphDir, graphPath)}`);
      continue;
    }

    if (result.errors.length > 0) {
      totalErrors += result.errors.length;
      console.error(`  FAIL  ${formatRef(graphDir, graphPath)}`);
      for (const err of result.errors) {
        console.error(`        ERROR: ${err}`);
      }
    } else {
      console.log(`  PASS  ${formatRef(graphDir, graphPath)} (with warnings)`);
    }

    if (result.warnings.length > 0) {
      totalWarnings += result.warnings.length;
      for (const warn of result.warnings) {
        console.error(`        WARN:  ${warn}`);
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`Graphs: ${totalGraphs}, errors: ${totalErrors}, warnings: ${totalWarnings}`);

  if (totalErrors > 0) process.exit(1);
}

main();

