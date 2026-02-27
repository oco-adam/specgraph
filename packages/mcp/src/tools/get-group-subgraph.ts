import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DEFAULT_DIRECTORY } from '../constants.js';
import { loadGraph } from '../graph/loader.js';
import { getGroupSubgraph } from '../graph/query.js';
import type { ToolContext } from './context.js';
import { toolError, toolSuccess } from './result.js';
import { Directory, NodeId } from './schemas.js';

export function registerGetGroupSubgraphTool(server: McpServer, context: ToolContext): void {
  server.registerTool(
    'get_group_subgraph',
    {
      description: 'Get a grouping node (feature or layer) and all nodes it contains (via "contains" edges).',
      inputSchema: {
        directory: Directory,
        group_id: NodeId.describe('ID of the grouping node (feature or layer). Example: AUTH or PLATFORM')
      }
    },
    async ({ directory, group_id }) => {
      try {
        const graph = await loadGraph(context.repoDir, directory ?? DEFAULT_DIRECTORY);
        return toolSuccess(getGroupSubgraph(graph, group_id));
      } catch (error) {
        return toolError(error);
      }
    }
  );
}
