import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

// Import tools
import { savePublicFileTool, handleSavePublicFile } from './tools/save-public-file.js';
import { savePrivateFileTool, handleSavePrivateFile } from './tools/save-private-file.js';
import { listFilesTool, handleListFiles } from './tools/list-files.js';
import { getFileUrlTool, handleGetFileUrl } from './tools/get-file-url.js';

class SaveForMeDearAIServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'saveformedearai',
        version: '1.0.0',
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers(): void {
    // Handle list_tools requests
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          savePublicFileTool,
          savePrivateFileTool,
          listFilesTool,
          getFileUrlTool
        ],
      };
    });

    // Handle call_tool requests
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case 'save_public_file':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await handleSavePublicFile(args), null, 2),
                },
              ],
            };

          case 'save_private_file':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await handleSavePrivateFile(args), null, 2),
                },
              ],
            };

          case 'list_files':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await handleListFiles(args), null, 2),
                },
              ],
            };

          case 'get_file_url':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await handleGetFileUrl(args), null, 2),
                },
              ],
            };

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: errorMessage,
                success: false
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    });
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    // Uncomment for debugging
    // console.error('SaveForMeDearAI MCP server running on stdio');
  }
}

const server = new SaveForMeDearAIServer();
server.run().catch((error) => {
  console.error('Failed to run server:', error);
  process.exit(1);
});