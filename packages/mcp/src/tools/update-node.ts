import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DEFAULT_DIRECTORY } from '../constants.js';
import { updateNode } from '../graph/writer.js';
import type { SpecNode } from '../types.js';
import type { ToolContext } from './context.js';
import { toolError, toolSuccess } from './result.js';
import { Directory, NodeInput } from './schemas.js';

export function registerUpdateNodeTool(server: McpServer, context: ToolContext): void {
  server.registerTool(
    'update_node',
    {
      description:
        'Replace an existing node in the spec graph. This is a FULL REPLACEMENT, not a partial patch. The node must already exist.',
      inputSchema: {
        directory: Directory,
        node: NodeInput.describe(
          'Complete replacement node object. ALL required fields must be present (including decision category + metadata.rationale and policy severity where applicable). Read the existing node with get_node, apply edits, and pass the full object.'
        )
      }
    },
    async ({ directory, node }) => {
      try {
        const result = await updateNode(context.repoDir, directory ?? DEFAULT_DIRECTORY, node as SpecNode);
        return toolSuccess(result);
      } catch (error) {
        return toolError(error);
      }
    }
  );
}
