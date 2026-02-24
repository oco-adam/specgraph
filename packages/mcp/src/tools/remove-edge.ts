import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DEFAULT_DIRECTORY } from '../constants.js';
import { removeEdge } from '../graph/writer.js';
import type { ToolContext } from './context.js';
import { toolError, toolSuccess } from './result.js';
import { Directory, EdgeType, NodeId } from './schemas.js';

export function registerRemoveEdgeTool(server: McpServer, context: ToolContext): void {
  server.registerTool(
    'remove_edge',
    {
      description: 'Remove a typed edge between two nodes.',
      inputSchema: {
        directory: Directory,
        source: NodeId.describe('ID of the source node.'),
        target: NodeId.describe('ID of the target node.'),
        edge_type: EdgeType.describe('Type of relationship to remove.')
      }
    },
    async ({ directory, source, target, edge_type }) => {
      try {
        const result = await removeEdge(context.repoDir, directory ?? DEFAULT_DIRECTORY, source, target, edge_type);
        return toolSuccess(result);
      } catch (error) {
        return toolError(error);
      }
    }
  );
}
