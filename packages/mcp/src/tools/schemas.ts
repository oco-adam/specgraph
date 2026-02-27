import * as z from 'zod/v4';
import { DEFAULT_DIRECTORY, EDGE_TYPES } from '../constants.js';

const NODE_TYPES = [
  'feature',
  'layer',
  'behavior',
  'decision',
  'domain',
  'policy',
  'design_token',
  'ui_contract',
  'api_contract',
  'data_model',
  'artifact',
  'equivalence_contract',
  'pipeline'
] as const;

const DECISION_CATEGORIES = ['architecture', 'stack', 'pattern', 'interface'] as const;
const POLICY_SEVERITIES = ['hard', 'soft'] as const;

const VERIFICATION_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
const VERIFICATION_KINDS = ['command', 'http', 'manual', 'observation', 'policy'] as const;

const VerificationEntryBase = z
  .object({
    kind: z.enum(VERIFICATION_KINDS),
    command: z.string().min(1).optional(),
    cwd: z.string().min(1).optional(),
    env: z.record(z.string(), z.string()).optional(),
    timeoutSeconds: z.number().int().min(1).max(3600).optional(),
    method: z.enum(VERIFICATION_METHODS).optional(),
    url: z.string().min(1).optional(),
    expectStatus: z.number().int().min(100).max(599).optional(),
    steps: z.array(z.string().min(1)).min(1).optional(),
    expected: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    ruleId: z.string().min(1).optional()
  })
  .strict();

export const Directory = z
  .string()
  .optional()
  .describe(`Graph directory relative to repo root (default: ${DEFAULT_DIRECTORY})`);

export const NodeId = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[A-Z][A-Z0-9-]{0,79}$/)
  .describe('Node identifier. Uppercase letters, digits, hyphens. Example: AUTH-01');

export const EdgeType = z
  .enum(EDGE_TYPES)
  .describe('Relationship type between nodes.');

export const NodeType = z
  .enum(NODE_TYPES)
  .describe('Spec graph node type.');

export const Links = z
  .object({
    contains: z.array(NodeId).optional(),
    depends_on: z.array(NodeId).optional(),
    constrains: z.array(NodeId).optional(),
    implements: z.array(NodeId).optional(),
    derived_from: z.array(NodeId).optional(),
    verified_by: z.array(NodeId).optional(),
    supersedes: z.array(NodeId).optional()
  })
  .strict()
  .optional()
  .describe('Outbound typed edges from this node.');

export const Metadata = z
  .object({
    rationale: z.string().optional(),
    notes: z.string().optional(),
    owner: z.string().optional(),
    tags: z.array(z.string()).optional(),
    rejected_alternatives: z
      .array(
        z
          .object({
            title: z.string().min(3),
            reason: z.string().min(10)
          })
          .strict()
      )
      .optional()
  })
  .passthrough()
  .optional()
  .describe('Non-executable context (rationale, notes, owner, tags). Some fields may be required by node type.');

const DecisionMetadata = z
  .object({
    rationale: z.string().min(10),
    notes: z.string().optional(),
    owner: z.string().optional(),
    tags: z.array(z.string()).optional(),
    rejected_alternatives: z
      .array(
        z
          .object({
            title: z.string().min(3),
            reason: z.string().min(10)
          })
          .strict()
      )
      .optional()
  })
  .passthrough();

const VerificationObject = z.discriminatedUnion('kind', [
  VerificationEntryBase.extend({
    kind: z.literal('command'),
    command: z.string().min(1)
  }),
  VerificationEntryBase.extend({
    kind: z.literal('http'),
    method: z.enum(VERIFICATION_METHODS),
    url: z.string().min(1),
    expectStatus: z.number().int().min(100).max(599)
  }),
  VerificationEntryBase.extend({
    kind: z.literal('manual'),
    steps: z.array(z.string().min(1)).min(1)
  }),
  VerificationEntryBase.extend({
    kind: z.literal('observation'),
    description: z.string().min(1)
  }),
  VerificationEntryBase.extend({
    kind: z.literal('policy'),
    ruleId: z.string().min(1)
  })
]);

export const VerificationEntry = z
  .union([
    z.string().min(1).describe('Shorthand verification (command or description).'),
    VerificationObject
  ])
  .describe('A single verification check.');

const PinInput = z
  .object({
    id: NodeId,
    sha256: z.string().regex(/^[A-Fa-f0-9]{64}$/)
  })
  .strict();

const ArtifactInfoInput = z
  .object({
    sha256: z.string().regex(/^[A-Fa-f0-9]{64}$/),
    source: z.string().min(1).optional(),
    format: z.string().min(1).optional()
  })
  .strict();

const GroupingNodeBase = {
  $schema: z.string().optional(),
  id: z
    .string()
    .regex(/^[A-Z][A-Z0-9-]{0,19}$/)
    .describe('Grouping node ID. Uppercase letters, digits, hyphens.'),
  title: z.string().min(3).max(100).describe('Human-readable grouping node name.'),
  description: z.string().min(1).describe('What this grouping namespace covers.'),
  links: Links,
  metadata: Metadata
};

export const FeatureNodeInput = z
  .object({
    ...GroupingNodeBase,
    type: z.literal('feature')
  })
  .strict();

export const LayerNodeInput = z
  .object({
    ...GroupingNodeBase,
    type: z.literal('layer')
  })
  .strict();

export const BehaviorNodeInput = z
  .object({
    $schema: z.string().optional(),
    id: NodeId,
    type: z.literal('behavior'),
    title: z.string().min(3).max(100).describe('Short behavior name.'),
    expectation: z
      .string()
      .min(10)
      .describe('WHAT the system does. Atomic: ONE trigger, ONE behavior, ONE outcome.'),
    constraints: z.array(z.string().min(1)).optional(),
    verification: z.string().min(5).describe('Single pass/fail check. Prefer executable commands.'),
    links: Links,
    metadata: Metadata
  })
  .strict();

const ContractNodeBase = {
  $schema: z.string().optional(),
  id: NodeId,
  title: z.string().min(3).max(140).describe('Short title.'),
  statement: z.string().min(1).describe('The declarative truth that must hold.'),
  pins: z.array(PinInput).optional(),
  constraints: z.array(z.string().min(1)).optional(),
  verification: z.array(VerificationEntry).min(1).describe('One or more pass/fail checks.'),
  links: Links,
  metadata: Metadata
};

export const DecisionNodeInput = z
  .object({
    ...ContractNodeBase,
    type: z.literal('decision'),
    category: z.enum(DECISION_CATEGORIES),
    metadata: DecisionMetadata
  })
  .strict();

export const DomainNodeInput = z
  .object({
    ...ContractNodeBase,
    type: z.literal('domain')
  })
  .strict();

export const PolicyNodeInput = z
  .object({
    ...ContractNodeBase,
    type: z.literal('policy'),
    severity: z.enum(POLICY_SEVERITIES)
  })
  .strict();

export const DesignTokenNodeInput = z
  .object({
    ...ContractNodeBase,
    type: z.literal('design_token')
  })
  .strict();

export const UiContractNodeInput = z
  .object({
    ...ContractNodeBase,
    type: z.literal('ui_contract')
  })
  .strict();

export const ApiContractNodeInput = z
  .object({
    ...ContractNodeBase,
    type: z.literal('api_contract')
  })
  .strict();

export const DataModelNodeInput = z
  .object({
    ...ContractNodeBase,
    type: z.literal('data_model')
  })
  .strict();

export const ArtifactNodeInput = z
  .object({
    ...ContractNodeBase,
    type: z.literal('artifact'),
    artifact: ArtifactInfoInput
  })
  .strict();

export const EquivalenceContractNodeInput = z
  .object({
    ...ContractNodeBase,
    type: z.literal('equivalence_contract')
  })
  .strict();

export const PipelineNodeInput = z
  .object({
    ...ContractNodeBase,
    type: z.literal('pipeline')
  })
  .strict();

export const NodeInput = z
  .discriminatedUnion('type', [
    FeatureNodeInput,
    LayerNodeInput,
    BehaviorNodeInput,
    DecisionNodeInput,
    DomainNodeInput,
    PolicyNodeInput,
    DesignTokenNodeInput,
    UiContractNodeInput,
    ApiContractNodeInput,
    DataModelNodeInput,
    ArtifactNodeInput,
    EquivalenceContractNodeInput,
    PipelineNodeInput
  ])
  .describe('Full node object. Required fields depend on the type field.');
