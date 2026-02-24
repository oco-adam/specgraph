import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DEFAULT_DIRECTORY } from '../constants.js';
import { addNode } from '../graph/writer.js';
import type { SpecNode } from '../types.js';
import type { ToolContext } from './context.js';
import { toolError, toolSuccess } from './result.js';
import { Directory, NodeInput } from './schemas.js';

export function registerAddNodeTool(server: McpServer, context: ToolContext): void {
  server.registerTool(
    'add_node',
    {
      description:
        'Add a new node to the spec graph. Validates against the node schema before writing. The node must not already exist.',
      inputSchema: {
        directory: Directory,
        node: NodeInput.describe(
          'Full node object to add. Required fields depend on type: feature needs {id, type, title, description}, behavior needs {id, type, title, expectation, verification}, contract types need {id, type, title, statement, verification}; decision additionally requires {category, metadata.rationale}; policy additionally requires {severity}.'
        )
      }
    },
    async ({ directory, node }) => {
      try {
        const result = await addNode(context.repoDir, directory ?? DEFAULT_DIRECTORY, node as SpecNode);
        return toolSuccess(result);
      } catch (error) {
        return toolError(error);
      }
    }
  );
}
