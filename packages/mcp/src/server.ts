import path from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAddEdgeTool } from './tools/add-edge.js';
import { registerAddNodeTool } from './tools/add-node.js';
import { registerGetUpstreamContextTool } from './tools/get-affecting-nodes.js';
import { registerGetEffectiveConstraintsTool } from './tools/get-effective-constraints.js';
import { registerGetFeatureSubgraphTool } from './tools/get-feature-subgraph.js';
import { registerGetGroupSubgraphTool } from './tools/get-group-subgraph.js';
import { registerGetNodeTool } from './tools/get-node.js';
import { registerInitTool } from './tools/init.js';
import { registerListDependenciesFullTool } from './tools/list-dependencies-full.js';
import { registerListDependenciesTool } from './tools/list-dependencies.js';
import { registerListEdgesTool } from './tools/list-edges.js';
import { registerListNodesTool } from './tools/list-nodes.js';
import { registerRemoveEdgeTool } from './tools/remove-edge.js';
import { registerRemoveNodeTool } from './tools/remove-node.js';
import { registerSearchNodesTool } from './tools/search-nodes.js';
import { registerUpdateNodeTool } from './tools/update-node.js';
import { registerValidateTool } from './tools/validate.js';

export interface ServerOptions {
  repoDir: string;
}

export function createSpecgraphMcpServer(options: ServerOptions): McpServer {
  const server = new McpServer(
    {
      name: 'specgraph-mcp',
      version: '0.3.0'
    },
    {
      capabilities: {
        logging: {}
      }
    }
  );

  const context = {
    repoDir: path.resolve(options.repoDir)
  };

  registerValidateTool(server, context);
  registerListNodesTool(server, context);
  registerGetNodeTool(server, context);
  registerGetUpstreamContextTool(server, context);
  registerListDependenciesTool(server, context);
  registerListDependenciesFullTool(server, context);
  registerGetEffectiveConstraintsTool(server, context);
  registerGetGroupSubgraphTool(server, context);
  registerGetFeatureSubgraphTool(server, context);
  registerListEdgesTool(server, context);
  registerSearchNodesTool(server, context);
  registerAddNodeTool(server, context);
  registerUpdateNodeTool(server, context);
  registerRemoveNodeTool(server, context);
  registerAddEdgeTool(server, context);
  registerRemoveEdgeTool(server, context);
  registerInitTool(server, context);

  return server;
}

export async function startStdioServer(options: ServerOptions): Promise<void> {
  const server = createSpecgraphMcpServer(options);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
