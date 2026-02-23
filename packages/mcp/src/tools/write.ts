import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { DEFAULT_DIRECTORY, EDGE_TYPES } from '../constants.js';
import type { SpecNode } from '../types.js';
import { addEdge, addNode, removeEdge, removeNode, updateNode } from '../graph/writer.js';
import type { ToolContext } from './context.js';
import { toolError, toolSuccess } from './result.js';

const WriteOperation = z.enum(['add_node', 'update_node', 'remove_node', 'add_edge', 'remove_edge']);
const EdgeType = z.enum(EDGE_TYPES);

const AddOrUpdateNodeArgs = z.object({ node: z.record(z.string(), z.unknown()) }).strict();
const RemoveNodeArgs = z.object({ node_id: z.string().min(1) }).strict();
const EdgeArgs = z
  .object({
    source: z.string().min(1),
    target: z.string().min(1),
    edge_type: EdgeType
  })
  .strict();

export function registerWriteTool(server: McpServer, context: ToolContext): void {
  server.registerTool(
    'write_specgraph',
    {
      description: 'Create, update, and remove nodes/edges in a Spec Graph with schema validation.',
      inputSchema: {
        directory: z.string().optional().describe(`Graph directory relative to repo root (default: ${DEFAULT_DIRECTORY})`),
        operation: WriteOperation,
        args: z.record(z.string(), z.unknown()).optional()
      }
    },
    async ({ directory, operation, args }) => {
      try {
        const graphDir = directory ?? DEFAULT_DIRECTORY;
        const safeArgs = args ?? {};

        switch (operation) {
          case 'add_node': {
            const parsed = AddOrUpdateNodeArgs.parse(safeArgs);
            return toolSuccess(await addNode(context.repoDir, graphDir, parsed.node as SpecNode));
          }

          case 'update_node': {
            const parsed = AddOrUpdateNodeArgs.parse(safeArgs);
            return toolSuccess(await updateNode(context.repoDir, graphDir, parsed.node as SpecNode));
          }

          case 'remove_node': {
            const parsed = RemoveNodeArgs.parse(safeArgs);
            return toolSuccess(await removeNode(context.repoDir, graphDir, parsed.node_id));
          }

          case 'add_edge': {
            const parsed = EdgeArgs.parse(safeArgs);
            return toolSuccess(
              await addEdge(context.repoDir, graphDir, parsed.source, parsed.target, parsed.edge_type)
            );
          }

          case 'remove_edge': {
            const parsed = EdgeArgs.parse(safeArgs);
            return toolSuccess(
              await removeEdge(context.repoDir, graphDir, parsed.source, parsed.target, parsed.edge_type)
            );
          }

          default:
            return toolError(`Unsupported operation: ${operation}`);
        }
      } catch (error) {
        return toolError(error);
      }
    }
  );
}
