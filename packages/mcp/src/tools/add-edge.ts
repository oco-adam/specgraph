import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DEFAULT_DIRECTORY } from '../constants.js';
import { addEdge } from '../graph/writer.js';
import type { ToolContext } from './context.js';
import { toolError, toolSuccess } from './result.js';
import { Directory, EdgeType, NodeId } from './schemas.js';

export function registerAddEdgeTool(server: McpServer, context: ToolContext): void {
  server.registerTool(
    'add_edge',
    {
      description: 'Add a typed edge between two existing nodes. The edge is stored as a link on the source node.',
      inputSchema: {
        directory: Directory,
        source: NodeId.describe('ID of the source node (where the edge originates).'),
        target: NodeId.describe('ID of the target node (where the edge points).'),
        edge_type: EdgeType.describe(
          'Type of relationship: contains, depends_on, constrains, implements, derived_from, verified_by, or supersedes.'
        )
      }
    },
    async ({ directory, source, target, edge_type }) => {
      try {
        const result = await addEdge(context.repoDir, directory ?? DEFAULT_DIRECTORY, source, target, edge_type);
        return toolSuccess(result);
      } catch (error) {
        return toolError(error);
      }
    }
  );
}
