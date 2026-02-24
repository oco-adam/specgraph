import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DEFAULT_DIRECTORY } from '../constants.js';
import { loadGraph } from '../graph/loader.js';
import { getNode } from '../graph/query.js';
import type { ToolContext } from './context.js';
import { toolError, toolSuccess } from './result.js';
import { Directory, NodeId } from './schemas.js';

export function registerGetNodeTool(server: McpServer, context: ToolContext): void {
  server.registerTool(
    'get_node',
    {
      description: 'Get the full JSON content of a single node by its ID.',
      inputSchema: {
        directory: Directory,
        node_id: NodeId.describe('ID of the node to retrieve. Example: AUTH-01')
      }
    },
    async ({ directory, node_id }) => {
      try {
        const graph = await loadGraph(context.repoDir, directory ?? DEFAULT_DIRECTORY);
        return toolSuccess(getNode(graph, node_id));
      } catch (error) {
        return toolError(error);
      }
    }
  );
}
