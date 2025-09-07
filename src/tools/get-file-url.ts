import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { S3Manager } from '../s3/client.js';
import { ConfigManager } from '../config/manager.js';

/**
 * MCP Tool Definition: get_file_url
 * 
 * Provides intelligent URL generation for S3 files based on their visibility
 * status. Automatically determines whether to return permanent public URLs
 * or generate secure presigned URLs for private files.
 * 
 * Features:
 * - Automatic file visibility detection
 * - Intelligent URL type selection (permanent vs temporary)
 * - Configurable expiration times for presigned URLs
 * - File existence validation before URL generation
 * - Comprehensive metadata in responses
 * - Security-conscious defaults for unknown files
 */
export const getFileUrlTool: Tool = {
  name: 'get_file_url',
  description: 'Get a temporary or permanent URL for a file. For public files, returns permanent URL. For private files, returns temporary presigned URL.',
  inputSchema: {
    type: 'object',
    properties: {
      filename: {
        type: 'string',
        description: 'Name/key of the file to get URL for'
      },
      expiresIn: {
        type: 'number',
        description: 'Expiration time for presigned URLs in seconds (default: 3600 = 1 hour, max: 604800 = 7 days)',
        minimum: 60,
        maximum: 604800
      }
    },
    required: ['filename']
  }
};

/**
 * Handle get_file_url MCP tool requests.
 * 
 * Processes URL generation requests with intelligent visibility detection
 * and appropriate URL type selection. The function validates file existence,
 * examines metadata to determine visibility status, and generates the
 * appropriate URL type (permanent for public, presigned for private).
 * 
 * URL Generation Workflow:
 * 1. Validate active S3 configuration exists
 * 2. Initialize S3Manager with resolved configuration
 * 3. Verify file exists in S3 storage
 * 4. Retrieve file metadata to determine visibility status
 * 5. Generate appropriate URL type based on public/private status
 * 6. Return structured response with URL and metadata
 * 
 * @param args - Tool arguments from MCP request
 * @param args.filename - S3 key of the file to generate URL for
 * @param args.expiresIn - Optional expiration time for presigned URLs (seconds)
 * @returns Structured response with generated URL and metadata
 */
export async function handleGetFileUrl(args: any): Promise<any> {
  const { filename, expiresIn = 3600 } = args;

  try {
    // Resolve active S3 configuration using hierarchical system
    const activeConfig = await ConfigManager.getActiveConfig();
    if (!activeConfig) {
      return {
        error: 'No configuration found. Please run the setup command first.',
        success: false
      };
    }

    const s3Manager = new S3Manager(activeConfig.s3Config);
    
    // Validate file existence before attempting URL generation
    const fileExists = await s3Manager.fileExists(filename);
    if (!fileExists) {
      return {
        error: `File '${filename}' not found`,
        success: false
      };
    }

    // Retrieve file metadata to determine visibility and access strategy
    const metadata = await s3Manager.getFileMetadata(filename);
    
    if (metadata?.isPublic) {
      // Public file: Generate permanent direct access URL
      const publicUrl = s3Manager['getPublicBaseUrl']() + '/' + filename;
      return {
        success: true,
        url: publicUrl,
        urlType: 'permanent',
        isPublic: true,
        filename,
        driveName: activeConfig.driveName,
        message: 'Public file - permanent URL provided'
      };
    } else {
      // Private file: Generate time-limited presigned URL for secure access
      const presignedUrl = await s3Manager.getPresignedUrl(filename, expiresIn);
      const expirationDate = new Date(Date.now() + expiresIn * 1000);
      
      return {
        success: true,
        url: presignedUrl,
        urlType: 'temporary',
        isPublic: false,
        filename,
        expiresIn,
        expirationDate: expirationDate.toISOString(),
        driveName: activeConfig.driveName,
        message: `Temporary URL generated, expires at ${expirationDate.toLocaleString()}`
      };
    }
  } catch (error) {
    // Return standardized error response with detailed message
    return {
      error: `Failed to get file URL: ${error instanceof Error ? error.message : String(error)}`,
      success: false
    };
  }
}