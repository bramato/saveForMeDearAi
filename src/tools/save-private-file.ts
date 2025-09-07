import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { S3Manager } from '../s3/client.js';
import { ConfigManager } from '../config/manager.js';

/**
 * MCP Tool Definition: save_private_file
 * 
 * Uploads files to S3 storage with private access control, ensuring
 * files are only accessible through presigned URLs. This tool is ideal
 * for sensitive documents, user-generated content, or any files that
 * require controlled access.
 * 
 * Features:
 * - Private file storage with no public access
 * - Automatic presigned URL generation for immediate access
 * - Configurable URL expiration times
 * - Metadata attachment for organization
 * - Secure credential-based access control
 */
export const savePrivateFileTool: Tool = {
  name: 'save_private_file',
  description: 'Save a file to S3 storage as private. Use get_file_url to get temporary access URLs.',
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
 * Handle save_private_file MCP tool requests.
 * 
 * Processes private file upload requests with comprehensive security measures
 * and immediate presigned URL generation. The function ensures files are
 * stored with private access controls and provides temporary URLs for
 * immediate access.
 * 
 * Security Workflow:
 * 1. Validate active S3 configuration exists
 * 2. Initialize S3Manager with resolved configuration
 * 3. Upload file without public-read permissions
 * 4. Generate presigned URL for temporary access (1 hour default)
 * 5. Return structured response with security metadata
 * 
 * @param args - Tool arguments from MCP request
 * @param args.filePath - Path to local file to upload
 * @param args.filename - Optional custom filename
 * @param args.description - Optional file description metadata
 * @returns Structured response with upload results and temporary URL
 */
export async function handleSavePrivateFile(args: any): Promise<any> {
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
    
    // Upload file with private access (no public permissions)
    const result = await s3Manager.uploadFile(filePath, {
      key: filename,
      isPublic: false,
      description
    });

    // Return comprehensive response with security details
    return {
      success: true,
      key: result.key,
      url: result.url,                // Presigned URL for immediate access
      temporaryUrl: result.url,       // Backward compatibility field
      urlType: 'temporary',
      expiresIn: 3600,               // URL valid for 1 hour
      expirationDate: new Date(Date.now() + 3600 * 1000).toISOString(),
      message: `File uploaded successfully as private file. Temporary URL provided (expires in 1 hour).`,
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