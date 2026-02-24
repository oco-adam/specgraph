import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DEFAULT_DIRECTORY } from '../constants.js';
import { loadGraph } from '../graph/loader.js';
import { listEdges } from '../graph/query.js';
import type { ToolContext } from './context.js';
import { toolError, toolSuccess } from './result.js';
import { Directory } from './schemas.js';

export function registerListEdgesTool(server: McpServer, context: ToolContext): void {
  server.registerTool(
    'list_edges',
    {
      description: 'List all edges in the spec graph as {source, target, edge_type} triples.',
      inputSchema: {
        directory: Directory
      }
    },
    async ({ directory }) => {
      try {
        const graph = await loadGraph(context.repoDir, directory ?? DEFAULT_DIRECTORY);
        return toolSuccess(listEdges(graph));
      } catch (error) {
        return toolError(error);
      }
    }
  );
}
