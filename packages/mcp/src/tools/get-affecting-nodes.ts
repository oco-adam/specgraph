import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DEFAULT_DIRECTORY } from '../constants.js';
import { loadGraph } from '../graph/loader.js';
import { getAffectingNodes } from '../graph/query.js';
import type { ToolContext } from './context.js';
import { toolError, toolSuccess } from './result.js';
import { Directory, NodeId } from './schemas.js';

export function registerGetUpstreamContextTool(server: McpServer, context: ToolContext): void {
  const inputSchema = {
    directory: Directory,
    node_id: NodeId.describe('ID of the node to analyze. Example: AUTH-01')
  };

  const handler = async ({ directory, node_id }: { directory?: string; node_id: string }) => {
    try {
      const graph = await loadGraph(context.repoDir, directory ?? DEFAULT_DIRECTORY);
      return toolSuccess(getAffectingNodes(graph, node_id));
    } catch (error) {
      return toolError(error);
    }
  };

  server.registerTool(
    'get_upstream_context',
    {
      description:
        'Return all upstream nodes that influence a target node, with reason labels (depends_on, constrains, contains ancestry, implements, verification, derivation, supersession).',
      inputSchema
    },
    handler
  );

  // Backward-compatible alias.
  server.registerTool(
    'get_affecting_nodes',
    {
      description: 'Alias for get_upstream_context.',
      inputSchema
    },
    handler
  );
}
