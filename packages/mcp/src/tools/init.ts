import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { DEFAULT_DIRECTORY } from '../constants.js';
import { initSpecgraph } from '../graph/writer.js';
import type { ToolContext } from './context.js';
import { toolError, toolSuccess } from './result.js';

const RootFeatureSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1)
  })
  .strict();

export function registerInitTool(server: McpServer, context: ToolContext): void {
  server.registerTool(
    'init_specgraph',
    {
      description:
        'Initialize a new Spec Graph directory with graph.json and a root feature node (defaults to ROOT).',
      inputSchema: {
        directory: z.string().optional().describe(`Graph directory relative to repo root (default: ${DEFAULT_DIRECTORY})`),
        specgraph_version: z.string().optional(),
        root_feature: RootFeatureSchema.optional()
      }
    },
    async ({ directory, specgraph_version, root_feature }) => {
      try {
        const result = await initSpecgraph(context.repoDir, {
          directory: directory ?? DEFAULT_DIRECTORY,
          specgraphVersion: specgraph_version,
          rootFeature: root_feature
        });
        return toolSuccess(result);
      } catch (error) {
        return toolError(error);
      }
    }
  );
}
