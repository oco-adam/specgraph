#!/usr/bin/env node

/**
 * Validates Spec Graph example files against their JSON Schemas.
 * Usage: node validate.js
 */

const Ajv2020 = require('ajv/dist/2020');
const fs = require('fs');
const path = require('path');

const SCHEMAS_DIR = path.join(__dirname, 'website', 'static', 'schemas');
const EXAMPLES_DIR = path.join(__dirname, 'website', 'static', 'examples');

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function findJsonFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findJsonFiles(fullPath));
    } else if (entry.name.endsWith('.json')) {
      results.push(fullPath);
    }
  }
  return results;
}

function main() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });

  // Load schemas
  const graphSchema = loadJson(path.join(SCHEMAS_DIR, 'graph.schema.json'));
  const nodeSchema = loadJson(path.join(SCHEMAS_DIR, 'node.schema.json'));
  const graphIndexSchema = loadJson(path.join(SCHEMAS_DIR, 'graph-index.schema.json'));
  const manifestLockSchema = loadJson(path.join(SCHEMAS_DIR, 'manifest-lock.schema.json'));

  const validateGraph = ajv.compile(graphSchema);
  const validateNode = ajv.compile(nodeSchema);
  const validateGraphIndex = ajv.compile(graphIndexSchema);
  const validateManifestLock = ajv.compile(manifestLockSchema);

  let totalFiles = 0;
  let totalErrors = 0;

  // Find all example directories
  const exampleDirs = fs.readdirSync(EXAMPLES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const exampleName of exampleDirs) {
    const exampleDir = path.join(EXAMPLES_DIR, exampleName);
    console.log(`\n--- Example: ${exampleName} ---`);

    // Validate graph.json
    const graphPath = path.join(exampleDir, 'graph.json');
    if (fs.existsSync(graphPath)) {
      totalFiles++;
      const data = loadJson(graphPath);
      if (!validateGraph(data)) {
        console.error(`  FAIL  ${path.relative(EXAMPLES_DIR, graphPath)}`);
        console.error(`        ${ajv.errorsText(validateGraph.errors)}`);
        totalErrors++;
      } else {
        console.log(`  PASS  ${path.relative(EXAMPLES_DIR, graphPath)}`);
      }
    }

    // Validate graph.index.json if present
    const graphIndexPath = path.join(exampleDir, 'graph.index.json');
    if (fs.existsSync(graphIndexPath)) {
      totalFiles++;
      const data = loadJson(graphIndexPath);
      if (!validateGraphIndex(data)) {
        console.error(`  FAIL  ${path.relative(EXAMPLES_DIR, graphIndexPath)}`);
        console.error(`        ${ajv.errorsText(validateGraphIndex.errors)}`);
        totalErrors++;
      } else {
        console.log(`  PASS  ${path.relative(EXAMPLES_DIR, graphIndexPath)}`);
      }
    }

    // Validate manifest.lock.json if present
    const manifestPath = path.join(exampleDir, 'manifest.lock.json');
    if (fs.existsSync(manifestPath)) {
      totalFiles++;
      const data = loadJson(manifestPath);
      if (!validateManifestLock(data)) {
        console.error(`  FAIL  ${path.relative(EXAMPLES_DIR, manifestPath)}`);
        console.error(`        ${ajv.errorsText(validateManifestLock.errors)}`);
        totalErrors++;
      } else {
        console.log(`  PASS  ${path.relative(EXAMPLES_DIR, manifestPath)}`);
      }
    }

    // Validate all node files
    const nodesDir = path.join(exampleDir, 'nodes');
    const nodeFiles = findJsonFiles(nodesDir);
    for (const nodeFile of nodeFiles) {
      totalFiles++;
      const data = loadJson(nodeFile);
      if (!validateNode(data)) {
        console.error(`  FAIL  ${path.relative(EXAMPLES_DIR, nodeFile)}`);
        console.error(`        ${ajv.errorsText(validateNode.errors)}`);
        totalErrors++;
      } else {
        console.log(`  PASS  ${path.relative(EXAMPLES_DIR, nodeFile)}`);
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`Total: ${totalFiles} files, ${totalErrors} errors`);

  if (totalErrors > 0) {
    process.exit(1);
  } else {
    console.log('All validations passed.');
  }
}

main();
