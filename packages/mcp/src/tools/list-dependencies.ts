import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DEFAULT_DIRECTORY } from '../constants.js';
import { loadGraph } from '../graph/loader.js';
import { listDependencies } from '../graph/query.js';
import type { ToolContext } from './context.js';
import { toolError, toolSuccess } from './result.js';
import { Directory, NodeId } from './schemas.js';

export function registerListDependenciesTool(server: McpServer, context: ToolContext): void {
  server.registerTool(
    'list_dependencies',
    {
      description: 'List direct depends_on dependencies for a node.',
      inputSchema: {
        directory: Directory,
        node_id: NodeId.describe('ID of the node to inspect. Example: AUTH-01')
      }
    },
    async ({ directory, node_id }) => {
      try {
        const graph = await loadGraph(context.repoDir, directory ?? DEFAULT_DIRECTORY);
        return toolSuccess(listDependencies(graph, node_id));
      } catch (error) {
        return toolError(error);
      }
    }
  );
}
