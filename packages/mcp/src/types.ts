import type { EDGE_TYPES } from './constants.js';

export type EdgeType = (typeof EDGE_TYPES)[number];

export interface NodeRef {
  id: string;
  path: string;
  expectedType?: string;
  sha256?: string;
}

export interface GraphIndex {
  $schema?: string;
  specgraphVersion: string;
  root?: string;
  nodeSearchPaths?: string[];
  nodes: NodeRef[];
  defaults?: Record<string, unknown>;
}

export type NodeLinks = Partial<Record<EdgeType, string[]>>;

export type SpecNode = Record<string, unknown> & {
  id: string;
  type: string;
  title?: string;
  links?: NodeLinks;
};

export interface LoadedGraph {
  repoDir: string;
  directory: string;
  graphDir: string;
  graphPath: string;
  index: GraphIndex;
  refsById: Map<string, NodeRef>;
  nodesById: Map<string, SpecNode>;
}

export interface SchemaIssueDetail {
  path: string;
  message: string;
}

export interface SchemaIssue {
  node_id: string;
  file: string;
  errors: SchemaIssueDetail[];
}

export interface StructuralIssue {
  node_id: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  total_nodes: number;
  valid_nodes: number;
  schema_errors: SchemaIssue[];
  structural_issues: StructuralIssue[];
}

export interface OperationResult {
  success: boolean;
  operation: string;
  node_id?: string;
  files_changed?: string[];
  [key: string]: unknown;
}
