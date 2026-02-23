import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { DEFAULT_DIRECTORY } from '../constants.js';
import { loadGraph } from '../graph/loader.js';
import { getFeatureSubgraph, getNode, listEdges, listNodes, searchNodes } from '../graph/query.js';
import type { ToolContext } from './context.js';
import { toolError, toolSuccess } from './result.js';

const QueryOperation = z.enum([
  'list_nodes',
  'get_node',
  'get_feature_subgraph',
  'list_edges',
  'search'
]);

const GetNodeArgs = z.object({ node_id: z.string().min(1) }).strict();
const GetFeatureSubgraphArgs = z.object({ feature_id: z.string().min(1) }).strict();
const SearchArgs = z.object({ query: z.string().min(1) }).strict();

export function registerQueryTool(server: McpServer, context: ToolContext): void {
  server.registerTool(
    'query_specgraph',
    {
      description: 'Query nodes, edges, and feature subgraphs from a Spec Graph.',
      inputSchema: {
        directory: z.string().optional().describe(`Graph directory relative to repo root (default: ${DEFAULT_DIRECTORY})`),
        operation: QueryOperation,
        args: z.record(z.string(), z.unknown()).optional()
      }
    },
    async ({ directory, operation, args }) => {
      try {
        const graph = await loadGraph(context.repoDir, directory ?? DEFAULT_DIRECTORY);
        const safeArgs = args ?? {};

        switch (operation) {
          case 'list_nodes':
            return toolSuccess(listNodes(graph));

          case 'get_node': {
            const { node_id } = GetNodeArgs.parse(safeArgs);
            return toolSuccess(getNode(graph, node_id));
          }

          case 'get_feature_subgraph': {
            const { feature_id } = GetFeatureSubgraphArgs.parse(safeArgs);
            return toolSuccess(getFeatureSubgraph(graph, feature_id));
          }

          case 'list_edges':
            return toolSuccess(listEdges(graph));

          case 'search': {
            const { query } = SearchArgs.parse(safeArgs);
            return toolSuccess(searchNodes(graph, query));
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
