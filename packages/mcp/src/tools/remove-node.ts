import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DEFAULT_DIRECTORY } from '../constants.js';
import { removeNode } from '../graph/writer.js';
import type { ToolContext } from './context.js';
import { toolError, toolSuccess } from './result.js';
import { Directory, NodeId } from './schemas.js';

export function registerRemoveNodeTool(server: McpServer, context: ToolContext): void {
  server.registerTool(
    'remove_node',
    {
      description: 'Remove a node from the spec graph. Also removes all edges pointing to this node from other nodes.',
      inputSchema: {
        directory: Directory,
        node_id: NodeId.describe('ID of the node to remove. Example: AUTH-01')
      }
    },
    async ({ directory, node_id }) => {
      try {
        const result = await removeNode(context.repoDir, directory ?? DEFAULT_DIRECTORY, node_id);
        return toolSuccess(result);
      } catch (error) {
        return toolError(error);
      }
    }
  );
}
