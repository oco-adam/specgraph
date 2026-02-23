import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { DEFAULT_DIRECTORY } from '../constants.js';
import { validateSpecgraph } from '../graph/validator.js';
import type { ToolContext } from './context.js';
import { toolError, toolSuccess } from './result.js';

export function registerValidateTool(server: McpServer, context: ToolContext): void {
  server.registerTool(
    'validate_specgraph',
    {
      description: 'Validate graph.json and all node files against schemas and structural constraints.',
      inputSchema: {
        directory: z.string().optional().describe(`Graph directory relative to repo root (default: ${DEFAULT_DIRECTORY})`)
      }
    },
    async ({ directory }) => {
      try {
        const result = await validateSpecgraph(context.repoDir, directory ?? DEFAULT_DIRECTORY);
        return toolSuccess(result);
      } catch (error) {
        return toolError(error);
      }
    }
  );
}
