import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DEFAULT_DIRECTORY } from '../constants.js';
import { loadGraph } from '../graph/loader.js';
import { getEffectiveConstraints } from '../graph/query.js';
import type { ToolContext } from './context.js';
import { toolError, toolSuccess } from './result.js';
import { Directory, NodeId } from './schemas.js';

export function registerGetEffectiveConstraintsTool(server: McpServer, context: ToolContext): void {
  server.registerTool(
    'get_effective_constraints',
    {
      description:
        'Compute all constraining nodes that apply to a node, including inherited constraints via contains ancestry. Does not propagate via depends_on.',
      inputSchema: {
        directory: Directory,
        node_id: NodeId.describe('ID of the node whose effective constraints should be resolved. Example: AUTH-01')
      }
    },
    async ({ directory, node_id }) => {
      try {
        const graph = await loadGraph(context.repoDir, directory ?? DEFAULT_DIRECTORY);
        return toolSuccess(getEffectiveConstraints(graph, node_id));
      } catch (error) {
        return toolError(error);
      }
    }
  );
}
