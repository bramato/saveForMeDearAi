import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

// Import MCP tool definitions and handlers for S3 file management operations
import { savePublicFileTool, handleSavePublicFile } from './tools/save-public-file.js';
import { savePrivateFileTool, handleSavePrivateFile } from './tools/save-private-file.js';
import { listFilesTool, handleListFiles } from './tools/list-files.js';
import { getFileUrlTool, handleGetFileUrl } from './tools/get-file-url.js';

/**
 * SaveForMeDearAI MCP Server
 * 
 * A Model Context Protocol server that provides S3 file storage capabilities
 * for Claude Code integration. Supports multiple S3-compatible providers
 * including AWS S3 and DigitalOcean Spaces.
 * 
 * Key Features:
 * - Public and private file uploads with metadata support
 * - File listing with search and filtering capabilities
 * - URL generation for both permanent (public) and temporary (private) access
 * - Multi-provider S3 support with hierarchical configuration
 * - Automatic error handling and graceful degradation
 */
class SaveForMeDearAIServer {
  private server: Server;

  /**
   * Initialize the MCP server with tool handlers and error handling.
   * Sets up the core MCP infrastructure for S3 file management operations.
   */
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

  /**
   * Configure MCP tool handlers for the server.
   * 
   * Sets up handlers for:
   * - list_tools: Returns available S3 file management tools
   * - call_tool: Executes the requested tool with provided arguments
   * 
   * Each tool handler includes comprehensive error handling and returns
   * structured JSON responses that Claude Code can interpret.
   */
  private setupToolHandlers(): void {
    // Handle list_tools requests - returns the catalog of available S3 tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          savePublicFileTool,      // Upload files with public access
          savePrivateFileTool,     // Upload files with private access
          listFilesTool,           // List stored files with metadata
          getFileUrlTool           // Generate access URLs for files
        ],
      };
    });

    // Handle call_tool requests - routes tool execution to appropriate handlers
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        // Route tool calls to their respective handlers with consistent response formatting
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
            // Handle unknown tools with descriptive error message
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}. Available tools: save_public_file, save_private_file, list_files, get_file_url`
            );
        }
      } catch (error) {
        // Standardized error handling ensures consistent error responses
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

  /**
   * Configure comprehensive error handling for the MCP server.
   * 
   * Handles:
   * - Server-level errors with detailed logging
   * - Graceful shutdown on SIGINT (Ctrl+C)
   * - Process cleanup to prevent resource leaks
   */
  private setupErrorHandling(): void {
    // Log server-level errors for debugging and monitoring
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    // Handle graceful shutdown on interrupt signal
    process.on('SIGINT', async () => {
      console.error('Received SIGINT, shutting down gracefully...');
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Start the MCP server and establish communication transport.
   * 
   * Uses stdio transport for communication with Claude Code, enabling
   * seamless integration with the MCP ecosystem. The server runs
   * continuously until terminated or an error occurs.
   */
  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    // Server is now running and ready to handle MCP requests
    // Uncomment for debugging: console.error('SaveForMeDearAI MCP server running on stdio');
  }
}

// Initialize and start the SaveForMeDearAI MCP server
const server = new SaveForMeDearAIServer();

// Start the server with comprehensive error handling
server.run().catch((error) => {
  console.error('Failed to run server:', error);
  process.exit(1);
});