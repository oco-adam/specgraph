import path from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerInitTool } from './tools/init.js';
import { registerQueryTool } from './tools/query.js';
import { registerValidateTool } from './tools/validate.js';
import { registerWriteTool } from './tools/write.js';

export interface ServerOptions {
  repoDir: string;
}

export function createSpecgraphMcpServer(options: ServerOptions): McpServer {
  const server = new McpServer(
    {
      name: 'specgraph-mcp',
      version: '0.1.0'
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
  registerQueryTool(server, context);
  registerWriteTool(server, context);
  registerInitTool(server, context);

  return server;
}

export async function startStdioServer(options: ServerOptions): Promise<void> {
  const server = createSpecgraphMcpServer(options);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
