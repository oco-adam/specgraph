import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DEFAULT_DIRECTORY } from '../constants.js';
import { loadGraph } from '../graph/loader.js';
import { getFeatureSubgraph } from '../graph/query.js';
import type { ToolContext } from './context.js';
import { toolError, toolSuccess } from './result.js';
import { Directory, NodeId } from './schemas.js';

export function registerGetFeatureSubgraphTool(server: McpServer, context: ToolContext): void {
  server.registerTool(
    'get_feature_subgraph',
    {
      description: 'Get a feature node and all nodes it contains (via "contains" edges).',
      inputSchema: {
        directory: Directory,
        feature_id: NodeId.describe('ID of the feature node. Example: AUTH')
      }
    },
    async ({ directory, feature_id }) => {
      try {
        const graph = await loadGraph(context.repoDir, directory ?? DEFAULT_DIRECTORY);
        return toolSuccess(getFeatureSubgraph(graph, feature_id));
      } catch (error) {
        return toolError(error);
      }
    }
  );
}
