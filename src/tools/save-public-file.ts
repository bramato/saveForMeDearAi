import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { S3Manager } from '../s3/client.js';
import { ConfigManager } from '../config/manager.js';

/**
 * MCP Tool Definition: save_public_file
 * 
 * Uploads files to S3 storage with public read access, making them
 * immediately available via permanent public URLs. This tool is ideal
 * for sharing files, hosting assets, or creating publicly accessible
 * content libraries.
 * 
 * Features:
 * - Automatic content-type detection
 * - Custom filename support
 * - Metadata attachment for organization
 * - Immediate public URL generation
 * - Multi-provider S3 compatibility
 */
export const savePublicFileTool: Tool = {
  name: 'save_public_file',
  description: 'Save a file to S3 storage and make it publicly accessible. Returns the public URL.',
  inputSchema: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'Path to the local file to upload'
      },
      filename: {
        type: 'string',
        description: 'Optional custom filename for the uploaded file (defaults to original filename)'
      },
      description: {
        type: 'string',
        description: 'Optional description/metadata for the file'
      }
    },
    required: ['filePath']
  }
};

/**
 * Handle save_public_file MCP tool requests.
 * 
 * Processes public file upload requests with comprehensive error handling
 * and standardized response formatting. The function validates configuration,
 * manages the upload process, and provides detailed feedback including
 * immediate access URLs.
 * 
 * Workflow:
 * 1. Validate active S3 configuration exists
 * 2. Initialize S3Manager with resolved configuration
 * 3. Upload file with public-read permissions
 * 4. Return structured response with permanent public URL
 * 
 * @param args - Tool arguments from MCP request
 * @param args.filePath - Path to local file to upload
 * @param args.filename - Optional custom filename
 * @param args.description - Optional file description metadata
 * @returns Structured response with upload results or error details
 */
export async function handleSavePublicFile(args: any): Promise<any> {
  const { filePath, filename, description } = args;

  try {
    // Resolve active S3 configuration using hierarchical system
    const activeConfig = await ConfigManager.getActiveConfig();
    if (!activeConfig) {
      return {
        error: 'No configuration found. Please run the setup command first.',
        success: false
      };
    }

    // Initialize S3 client with resolved configuration
    const s3Manager = new S3Manager(activeConfig.s3Config);
    
    // Upload file with public access permissions
    const result = await s3Manager.uploadFile(filePath, {
      key: filename,
      isPublic: true,
      description
    });

    // Return comprehensive success response
    return {
      success: true,
      url: result.url,           // Permanent public URL for immediate use
      key: result.key,
      urlType: 'permanent',
      isPublic: true,
      message: `File uploaded successfully as public file. URL: ${result.url}`,
      driveName: activeConfig.driveName
    };
  } catch (error) {
    // Return standardized error response with detailed message
    return {
      error: `Failed to upload file: ${error instanceof Error ? error.message : String(error)}`,
      success: false
    };
  }
}