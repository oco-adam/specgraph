import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Ajv2020 } from 'ajv/dist/2020.js';
import type { ErrorObject, ValidateFunction } from 'ajv';
import { SCHEMA_BASE_URL } from '../constants.js';
import type { GraphIndex, SpecNode } from '../types.js';

const SCHEMA_ENV = {
  dir: process.env.SPECGRAPH_MCP_SCHEMA_DIR,
  baseUrl: process.env.SPECGRAPH_MCP_SCHEMA_BASE_URL,
  graphSchema: process.env.SPECGRAPH_MCP_GRAPH_SCHEMA,
  nodeSchema: process.env.SPECGRAPH_MCP_NODE_SCHEMA
};

let validatorsPromise: Promise<SchemaValidators> | undefined;

export interface SchemaValidators {
  validateGraph: ValidateFunction<GraphIndex>;
  validateNode: ValidateFunction<SpecNode>;
}

export function formatAjvErrors(errors: ErrorObject[] | null | undefined): Array<{ path: string; message: string }> {
  if (!errors || errors.length === 0) {
    return [{ path: '/', message: 'validation failed' }];
  }

  return errors.map((error) => ({
    path: error.instancePath || '/',
    message: error.message ?? 'validation failed'
  }));
}

export async function getSchemaValidators(): Promise<SchemaValidators> {
  if (!validatorsPromise) {
    validatorsPromise = buildSchemaValidators();
  }

  return validatorsPromise;
}

async function buildSchemaValidators(): Promise<SchemaValidators> {
  const [graphSchema, nodeSchema] = await Promise.all([
    loadSchema('graph.schema.json'),
    loadSchema('node.schema.json')
  ]);

  const ajv = new Ajv2020({ allErrors: true, strict: false });

  return {
    validateGraph: ajv.compile<GraphIndex>(graphSchema),
    validateNode: ajv.compile<SpecNode>(nodeSchema)
  };
}

async function loadSchema(schemaName: 'graph.schema.json' | 'node.schema.json'): Promise<object> {
  const override = schemaName === 'graph.schema.json' ? SCHEMA_ENV.graphSchema : SCHEMA_ENV.nodeSchema;
  const location = override ?? resolveSchemaLocation(schemaName);

  if (isHttpUrl(location)) {
    const response = await fetch(location);
    if (!response.ok) {
      throw new Error(`Failed to fetch schema ${location}: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as object;
  }

  const fs = await import('node:fs/promises');
  const raw = await fs.readFile(location, 'utf8');
  return JSON.parse(raw) as object;
}

function resolveSchemaLocation(schemaName: string): string {
  if (SCHEMA_ENV.dir) {
    return path.join(SCHEMA_ENV.dir, schemaName);
  }

  if (SCHEMA_ENV.baseUrl) {
    return new URL(schemaName, SCHEMA_ENV.baseUrl).toString();
  }

  const bundledPath = fileURLToPath(new URL(`../../schemas/${schemaName}`, import.meta.url));
  if (path.isAbsolute(bundledPath)) {
    return bundledPath;
  }

  return new URL(schemaName, SCHEMA_BASE_URL).toString();
}

function isHttpUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}
