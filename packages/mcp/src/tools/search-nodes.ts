import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { DEFAULT_DIRECTORY } from '../constants.js';
import { loadGraph } from '../graph/loader.js';
import { searchNodes } from '../graph/query.js';
import type { ToolContext } from './context.js';
import { toolError, toolSuccess } from './result.js';
import { Directory } from './schemas.js';

export function registerSearchNodesTool(server: McpServer, context: ToolContext): void {
  server.registerTool(
    'search_nodes',
    {
      description: 'Search nodes by fuzzy matching on id, title, and description/expectation/statement.',
      inputSchema: {
        directory: Directory,
        query: z.string().min(1).describe('Search term to match against node fields.')
      }
    },
    async ({ directory, query }) => {
      try {
        const graph = await loadGraph(context.repoDir, directory ?? DEFAULT_DIRECTORY);
        return toolSuccess(searchNodes(graph, query));
      } catch (error) {
        return toolError(error);
      }
    }
  );
}
