export const EDGE_TYPES = [
  'contains',
  'depends_on',
  'constrains',
  'implements',
  'derived_from',
  'verified_by',
  'supersedes'
] as const;

export const NODE_TYPE_DIRS: Record<string, string> = {
  feature: 'features',
  behavior: 'behaviors',
  decision: 'decisions',
  domain: 'domains',
  policy: 'policies',
  design_token: 'design_tokens',
  ui_contract: 'ui_contracts',
  api_contract: 'api_contracts',
  data_model: 'data_models',
  artifact: 'artifacts',
  equivalence_contract: 'equivalence_contracts',
  pipeline: 'pipelines'
};

export const DEFAULT_DIRECTORY = 'specgraph';
export const DEFAULT_SPECGRAPH_VERSION = process.env.SPECGRAPH_MCP_DEFAULT_SPECGRAPH_VERSION ?? '1.0.0';
export const SCHEMA_BASE_URL = 'https://oco-adam.github.io/specgraph/schemas/';
export const SCHEMA_FILE_NAMES = ['graph.schema.json', 'node.schema.json'] as const;
