import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DEFAULT_DIRECTORY } from '../constants.js';
import { loadGraph } from '../graph/loader.js';
import { listNodes } from '../graph/query.js';
import type { ToolContext } from './context.js';
import { toolError, toolSuccess } from './result.js';
import { Directory } from './schemas.js';

export function registerListNodesTool(server: McpServer, context: ToolContext): void {
  server.registerTool(
    'list_nodes',
    {
      description: 'List all nodes in the spec graph with id, type, title, and status.',
      inputSchema: {
        directory: Directory
      }
    },
    async ({ directory }) => {
      try {
        const graph = await loadGraph(context.repoDir, directory ?? DEFAULT_DIRECTORY);
        return toolSuccess(listNodes(graph));
      } catch (error) {
        return toolError(error);
      }
    }
  );
}
