import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DEFAULT_DIRECTORY } from '../constants.js';
import { loadGraph } from '../graph/loader.js';
import { listDependenciesFull } from '../graph/query.js';
import type { ToolContext } from './context.js';
import { toolError, toolSuccess } from './result.js';
import { Directory, NodeId } from './schemas.js';

export function registerListDependenciesFullTool(server: McpServer, context: ToolContext): void {
  server.registerTool(
    'list_dependencies_full',
    {
      description:
        'List full transitive depends_on context for a node, including decisions/policies and inherited constraining nodes from contains-based propagation.',
      inputSchema: {
        directory: Directory,
        node_id: NodeId.describe('ID of the node to inspect. Example: AUTH-01')
      }
    },
    async ({ directory, node_id }) => {
      try {
        const graph = await loadGraph(context.repoDir, directory ?? DEFAULT_DIRECTORY);
        return toolSuccess(listDependenciesFull(graph, node_id));
      } catch (error) {
        return toolError(error);
      }
    }
  );
}
